import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConversationService, toMessageDto } from '../conversation/conversation.service';
import { ContextBuilderService } from '../context/context-builder.service';
import { PromptBuilderService, type HistoryTurn } from '../prompt/prompt-builder.service';
import { SafetyService } from '../safety/safety.service';
import { ObservabilityService } from '../observability/observability.service';
import { CostControlService } from '../cost/cost-control.service';
import { ProviderOrchestratorService } from '../providers/provider-orchestrator.service';

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
              ? { provider: chunk.provider, model: chunk.model }
              : { provider: chunk.provider, model: chunk.model, safetyRefused: true, category: outputCheck.category },
          },
        });
        await this.prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });

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
        yield { type: 'error', data: { message: chunk.message } };
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
  }
}
