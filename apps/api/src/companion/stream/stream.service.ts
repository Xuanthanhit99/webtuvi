import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConversationService, toMessageDto } from '../conversation/conversation.service';
import { ContextBuilderService } from '../context/context-builder.service';
import { PromptBuilderService, type HistoryTurn } from '../prompt/prompt-builder.service';
import { SafetyService } from '../safety/safety.service';
import { ObservabilityService } from '../observability/observability.service';
import { CostControlService } from '../cost/cost-control.service';
import { ProviderOrchestratorService } from '../providers/provider-orchestrator.service';
import { GenerationLockService } from '../concurrency/generation-lock.service';
import { PROMPT_VERSION } from '../prompt/system-prompt';

export interface StreamEvent {
  type: 'token' | 'done' | 'error' | 'cancelled';
  data: Record<string, unknown>;
}

/**
 * Orchestrates one assistant turn end-to-end: find the pending user message,
 * build context + prompt, stream from ProviderOrchestratorService, persist
 * the result. Never throws out of `generate()` for expected failure modes
 * (ownership, nothing pending, provider failure) — always yields a clean
 * `error` event instead, so the SSE connection ends gracefully rather than
 * dropping.
 */
@Injectable()
export class StreamService {
  private readonly logger = new Logger('CompanionStream');

  constructor(
    private readonly prisma: PrismaService,
    private readonly conversationService: ConversationService,
    private readonly contextBuilder: ContextBuilderService,
    private readonly promptBuilder: PromptBuilderService,
    private readonly safety: SafetyService,
    private readonly observability: ObservabilityService,
    private readonly costControl: CostControlService,
    private readonly orchestrator: ProviderOrchestratorService,
    private readonly concurrency: GenerationLockService,
  ) {}

  async *generate(userId: string, conversationId: string, signal: AbortSignal): AsyncGenerator<StreamEvent> {
    try {
      await this.conversationService.findOwned(userId, conversationId);
    } catch {
      yield { type: 'error', data: { message: 'That conversation was not found.' } };
      return;
    }

    const messages = await this.prisma.conversationMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });

    const pending = messages[messages.length - 1];
    if (!pending || pending.role !== 'USER') {
      yield { type: 'error', data: { message: 'There is no pending message to respond to.' } };
      return;
    }

    // Prevents two overlapping generations for the same user (multiple tabs,
    // a stale reconnect, a misbehaving client) from both calling a provider at
    // once — see GenerationLockService. Released in `finally` below on every
    // exit path: success, provider error, cancellation, disconnect, timeout.
    const acquired = await this.concurrency.tryAcquire(userId);
    if (!acquired) {
      yield {
        type: 'error',
        data: {
          message: 'You already have a response in progress. Please wait for it to finish.',
          code: 'CONCURRENT_GENERATION',
        },
      };
      return;
    }

    try {
      const history: HistoryTurn[] = messages
        .slice(0, -1)
        .filter((m): m is typeof m & { role: 'USER' | 'ASSISTANT' } => m.role === 'USER' || m.role === 'ASSISTANT')
        .map((m) => ({ role: m.role === 'USER' ? 'user' : 'assistant', content: m.content }));

      const context = await this.contextBuilder.build(userId, conversationId);
      const promptMessages = this.promptBuilder.build(context, history, pending.content);

      let fullText = '';
      let finalProvider: string | null = null;
      let finalModel: string | null = null;
      let finishedCleanly = false;
      const startedAt = Date.now();

      for await (const chunk of this.orchestrator.stream(promptMessages, { signal })) {
        if (signal.aborted) break;

        if (chunk.type === 'token') {
          fullText += chunk.content;
          yield { type: 'token', data: { content: chunk.content } };
        } else if (chunk.type === 'done') {
          finalProvider = chunk.provider;
          finalModel = chunk.model;
          finishedCleanly = true;

          const outputCheck = this.safety.checkOutput(fullText);
          const persistedContent = outputCheck.allowed ? fullText : outputCheck.refusalMessage!;

          const assistantMessage = await this.prisma.conversationMessage.create({
            data: {
              conversationId,
              role: 'ASSISTANT',
              content: persistedContent,
              metadata: outputCheck.allowed
                ? { provider: chunk.provider, model: chunk.model, promptVersion: PROMPT_VERSION }
                : {
                    provider: chunk.provider,
                    model: chunk.model,
                    promptVersion: PROMPT_VERSION,
                    safetyRefused: true,
                    category: outputCheck.category,
                  },
            },
          });
          await this.prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });

          // Billable/final usage — written exactly once, only here, only for a
          // generation that actually completed. Never written for a provider
          // failure or total-chain exhaustion (see the `error` branch below and
          // ProviderOrchestratorService, which records per-attempt failures
          // separately via ObservabilityService/ProviderLog, not AIUsage).
          const estimatedCostUsd = await this.costControl.record({
            userId,
            conversationId,
            provider: chunk.provider,
            model: chunk.model,
            promptTokens: chunk.usage.promptTokens,
            completionTokens: chunk.usage.completionTokens,
          });
          this.observability.logUsage({
            userId,
            conversationId,
            provider: chunk.provider,
            model: chunk.model,
            promptTokens: chunk.usage.promptTokens,
            completionTokens: chunk.usage.completionTokens,
            estimatedCostUsd,
          });

          yield {
            type: outputCheck.allowed ? 'done' : 'error',
            data: outputCheck.allowed
              ? { message: toMessageDto(assistantMessage) }
              : { message: persistedContent },
          };
          return;
        } else if (chunk.type === 'error') {
          // No assistant message is persisted and no usage is recorded here —
          // whether this is a single interrupted attempt or the whole provider
          // chain being exhausted (`PROVIDER_UNAVAILABLE`), the user never sees
          // a fabricated reply and never gets charged for one.
          yield { type: 'error', data: { message: chunk.message, code: chunk.code } };
          return;
        }
      }

      // Loop ended without a 'done' — either the client cancelled (signal.aborted)
      // or a provider generator ended unexpectedly early. Either way, persist
      // whatever was generated so the conversation isn't left with a dangling
      // unanswered user message, and stop.
      if (!finishedCleanly) {
        const cancelled = signal.aborted;
        const content = fullText.trim().length > 0 ? fullText : cancelled ? '(cancelled)' : '(no response generated)';
        await this.prisma.conversationMessage.create({
          data: {
            conversationId,
            role: 'ASSISTANT',
            content,
            metadata: { cancelled, provider: finalProvider, model: finalModel, partial: fullText.length > 0 },
          },
        });
        await this.prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });

        if (!cancelled) {
          this.logger.warn(`Stream ended without a 'done' event and was not cancelled by the client (durationMs=${Date.now() - startedAt})`);
        }
      }
    } finally {
      await this.concurrency.release(userId);
    }
  }
}
