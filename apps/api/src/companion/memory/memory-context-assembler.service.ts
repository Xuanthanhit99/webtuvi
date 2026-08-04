import { Injectable } from '@nestjs/common';
import { MemoryRetrievalService } from '../../memory/retrieval/memory-retrieval.service';
import type { AssembledMemoryContext, MemoryReferenceDto, MemorySkipReferenceDto } from './memory-reference.types';

/** A hard count cap on top of the token budget — "never inject all memories" (Phase 7) means
 * more than a token limit: even if the budget would technically fit more, no single turn ever
 * cites more than this many memories, so the reply doesn't read like a data dump. */
export const MAX_MEMORIES_PER_TURN = 5;

export interface AssembleParams {
  userMessage: string;
  systemPromptText: string;
  conversationText: string;
}

/**
 * The one and only place Companion touches Memory Intelligence's retrieval pipeline — Phase 1's
 * "Companion never queries Memory directly": `StreamService` calls this, this calls
 * `MemoryRetrievalService.recommend()` (Memory Intelligence, Sprint 3B), never the other way
 * around, and nothing in `companion/` reads the `Memory` Prisma model directly anywhere else.
 *
 * Formats the retrieval result into a labeled, bounded prompt block (or `null` when there's
 * nothing to include — no empty section padding the prompt) and the reference/skip lists Phase 2
 * and Phase 8 require. See docs/architecture/companion-memory-integration.md "Retrieval pipeline".
 */
@Injectable()
export class MemoryContextAssembler {
  constructor(private readonly retrieval: MemoryRetrievalService) {}

  async assemble(userId: string, params: AssembleParams): Promise<AssembledMemoryContext> {
    const result = await this.retrieval.recommend(userId, {
      contextText: params.userMessage,
      systemPromptText: params.systemPromptText,
      conversationText: params.conversationText,
      userInputText: params.userMessage,
      limit: MAX_MEMORIES_PER_TURN,
    });

    const used: MemoryReferenceDto[] = result.items.map((item) => ({
      memoryId: item.id,
      title: item.title,
      type: item.type,
      reason: item.whyRecommended,
      retrievalType: item.retrievalType,
      importance: { score: item.importanceScore, explanations: item.importanceExplanations },
      retrievalTimestamp: item.retrievalTimestamp,
      sourceConversationId: item.sourceConversationId,
      createdAt: item.createdAt,
    }));

    const skipped: MemorySkipReferenceDto[] = result.skipped.map((item) => ({
      memoryId: item.id,
      title: item.title,
      type: item.type,
      reason: item.reason,
    }));

    const promptBlock =
      result.items.length === 0
        ? null
        : [
            "Things they've told you before that may be worth keeping in mind right now " +
              '(only bring these up if it feels natural — never force them in, and never claim to ' +
              'remember anything about them that is not listed here):',
            ...result.items.map((item) => `- [${item.type}] ${item.title}: "${item.summary}"`),
          ].join('\n');

    return {
      promptBlock,
      used,
      skipped,
      memoryTokenBudget: result.budget.memoryTokens,
      memoryTokenUsed: result.tokenUsed,
    };
  }
}
