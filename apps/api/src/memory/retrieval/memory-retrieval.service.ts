import { Injectable, Logger } from '@nestjs/common';
import type { Memory, MemoryType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { MemoryConsentService } from '../consent/memory-consent.service';
import { ContextBudgetService, type ContextBudgetDto } from '../budget/context-budget.service';
import { rankMemories, type RankableMemory } from './memory-ranking.util';
import { explainImportanceFactors } from '../importance/memory-importance.calculator';
import { significantTokens } from '../shared/text-normalization.util';

/** Bounds the candidate scan — see docs/architecture/memory-intelligence.md "Known limitations". */
const SCAN_LIMIT = 300;

export interface RetrievalParams {
  /** Optional free-text conversation/context hint — matched by deterministic token overlap,
   * never an embedding. Memories sharing no significant token with it are deprioritized but,
   * if *none* of the candidates match at all, the filter is not applied (an unmatched context
   * falls back to ranking every consented candidate rather than returning nothing — see
   * "Retrieval policy" in memory-intelligence.md). */
  contextText?: string;
  /** Hard cap on how many memories to return, independent of the token budget. */
  limit?: number;
  systemPromptText?: string;
  conversationText?: string;
  userInputText?: string;
}

/** How a memory came to be included — a plain, inspectable fact, never a hidden/ML score.
 * `PINNED` and `CONTEXT_MATCH` are checked before falling back to `IMPORTANCE_RANKED`, matching
 * the priority a user would expect an explanation to reflect (see memory-intelligence.md
 * "Retrieval algorithm" and, for Companion's consumption of this, companion-memory-integration.md
 * "Memory references"). */
export type RetrievalType = 'PINNED' | 'CONTEXT_MATCH' | 'IMPORTANCE_RANKED';

export type SkipReason = 'consent_denied' | 'over_budget' | 'limit_reached';

export interface RecommendedMemoryDto {
  id: string;
  type: MemoryType;
  title: string;
  summary: string;
  pinned: boolean;
  importanceScore: number;
  importanceExplanations: string[];
  whyRecommended: string;
  /** Sprint 3C (Companion integration) — every retrieved memory must carry these five fields,
   * "no hidden retrieval." See companion-memory-integration.md "Memory references". */
  retrievalType: RetrievalType;
  retrievalTimestamp: string;
  sourceConversationId: string | null;
  /** When the memory was originally created — distinct from `retrievalTimestamp` (when it was
   * used *this* turn). Companion's "I remembered this because..." explanation shows both. */
  createdAt: string;
}

export interface SkippedMemoryDto {
  id: string;
  type: MemoryType;
  title: string;
  reason: SkipReason;
}

export interface RetrievalResultDto {
  items: RecommendedMemoryDto[];
  /** Sprint 3C explainability requirement (Phase 8) — memories that were found but not
   * surfaced, and why. Never fabricated: each reason traces to an actual, checkable condition
   * (current consent, budget, or the caller's own `limit`). */
  skipped: SkippedMemoryDto[];
  candidateCount: number;
  budget: ContextBudgetDto;
  tokenUsed: number;
}

/**
 * The deterministic retrieval policy (Phase 5) + ranking (Phase 7) + context budgeting
 * (Phase 6), combined into one read path. No embeddings, no semantic search — filtering is by
 * hard status/consent rules and (optionally) plain token overlap; ordering is
 * MemoryRankingUtil's fixed tie-break chain. This is **not** wired into the live Companion
 * prompt this sprint (that integration is Sprint 3C's) — it powers the `/memory/recommendations`
 * read-only endpoint only. See docs/architecture/memory-intelligence.md "Retrieval algorithm".
 *
 * Hard exclusions (Phase 5 requirement — never retrieve): the base query only ever selects
 * `status: 'ACCEPTED'`, which structurally excludes DELETED (hard-deleted, can't exist),
 * ARCHIVED, REJECTED, CANDIDATE, and PENDING_CONSENT rows — there is no separate flag to
 * remember to check. Consent is re-checked against the user's *current* settings (not the
 * snapshot at acceptance time) via MemoryConsentService.canAccept, so revoking consent for a
 * type immediately stops it from being recommended, even though Sprint 3A's own policy
 * deliberately leaves the underlying Memory row visible elsewhere in the product.
 */
@Injectable()
export class MemoryRetrievalService {
  private readonly logger = new Logger('MemoryRetrieval');

  constructor(
    private readonly prisma: PrismaService,
    private readonly consent: MemoryConsentService,
    private readonly budget: ContextBudgetService,
  ) {}

  async recommend(userId: string, params: RetrievalParams = {}): Promise<RetrievalResultDto> {
    const startedAt = Date.now();
    const retrievalTimestamp = new Date().toISOString();

    const memories = await this.prisma.memory.findMany({
      where: { userId, status: 'ACCEPTED' },
      orderBy: { createdAt: 'desc' },
      take: SCAN_LIMIT,
    });

    const { allowed: consented, denied: consentDenied } = await this.filterByCurrentConsent(userId, memories);
    const relevant = filterByContext(consented, params.contextText);

    const ranked = rankMemories(relevant.map(toRankable));
    const rankedMemories = ranked.map((r) => memories.find((m) => m.id === r.id)!);

    const budgetResult = this.budget.computeBudget({
      systemPromptText: params.systemPromptText,
      conversationText: params.conversationText,
      userInputText: params.userInputText,
    });

    const fit = this.budget.fitToBudget(
      rankedMemories.map((m) => ({ id: m.id, text: `${m.title} ${m.summary}` })),
      budgetResult.memoryTokens,
    );

    let includedIds = fit.included.map((i) => i.id);
    let limitExcludedIds: string[] = [];
    if (params.limit && params.limit > 0 && includedIds.length > params.limit) {
      limitExcludedIds = includedIds.slice(params.limit);
      includedIds = includedIds.slice(0, params.limit);
    }
    const includedIdSet = new Set(includedIds);
    const includedMemories = rankedMemories.filter((m) => includedIdSet.has(m.id));

    if (includedIds.length > 0) {
      await this.prisma.memory.updateMany({
        where: { id: { in: includedIds } },
        data: { referencedCount: { increment: 1 }, lastReferencedAt: new Date() },
      });
    }

    const memoryById = new Map(memories.map((m) => [m.id, m]));
    const skipped: SkippedMemoryDto[] = [
      ...consentDenied.map((m) => toSkippedDto(m, 'consent_denied')),
      ...fit.excluded.map((i) => toSkippedDto(memoryById.get(i.id)!, 'over_budget')),
      ...limitExcludedIds.map((id) => toSkippedDto(memoryById.get(id)!, 'limit_reached')),
    ];

    const latencyMs = Date.now() - startedAt;
    await this.logRetrieval(userId, memories.length, includedMemories.length, budgetResult.memoryTokens, fit.tokenUsed, latencyMs);

    return {
      items: includedMemories.map((m) => toRecommendedDto(m, params.contextText, retrievalTimestamp)),
      skipped,
      candidateCount: memories.length,
      budget: budgetResult,
      tokenUsed: fit.tokenUsed,
    };
  }

  private async filterByCurrentConsent(userId: string, memories: Memory[]): Promise<{ allowed: Memory[]; denied: Memory[] }> {
    const distinctTypes = [...new Set(memories.map((m) => m.type))];
    const allowedByType = new Map<MemoryType, boolean>();
    for (const type of distinctTypes) {
      const decision = await this.consent.canAccept(userId, type);
      allowedByType.set(type, decision.allowed);
    }
    const allowed: Memory[] = [];
    const denied: Memory[] = [];
    for (const memory of memories) {
      (allowedByType.get(memory.type) === true ? allowed : denied).push(memory);
    }
    return { allowed, denied };
  }

  private async logRetrieval(
    userId: string,
    candidateCount: number,
    retrievedCount: number,
    tokenBudget: number,
    tokenUsed: number,
    latencyMs: number,
  ): Promise<void> {
    try {
      await this.prisma.memoryRetrievalLog.create({
        data: { userId, candidateCount, retrievedCount, tokenBudget, tokenUsed, latencyMs },
      });
    } catch (error) {
      // Best-effort observability, mirroring MemoryAuditService — never breaks retrieval itself.
      this.logger.error('Failed to persist MemoryRetrievalLog', error instanceof Error ? error.stack : undefined);
    }
    this.logger.log(
      `Retrieval: ${candidateCount} candidates -> ${retrievedCount} retrieved, ${tokenUsed}/${tokenBudget} memory tokens, ${latencyMs}ms`,
    );
  }
}

export function toRankable(memory: Memory): RankableMemory {
  return {
    id: memory.id,
    type: memory.type,
    importanceScore: memory.importanceScore,
    pinned: memory.pinned,
    referencedCount: memory.referencedCount,
    createdAt: memory.createdAt,
    lastReferencedAt: memory.lastReferencedAt,
  };
}

/** Deterministic, token-overlap-only relevance filter — not applied (falls back to `all`) when
 * no context is given or when it matches nothing, per this service's documented fallback rule.
 * Exported for MemoryEvaluationService (Phase 8), which exercises this same production logic
 * against labeled fixtures rather than reimplementing it. */
export function filterByContext(memories: Memory[], contextText: string | undefined): Memory[] {
  if (!contextText || contextText.trim().length === 0) return memories;

  const contextTokens = new Set(significantTokens(contextText));
  if (contextTokens.size === 0) return memories;

  const matched = memories.filter((m) => {
    const memoryTokens = significantTokens(`${m.title} ${m.summary}`);
    return memoryTokens.some((token) => contextTokens.has(token));
  });

  return matched.length > 0 ? matched : memories;
}

/** Deterministic, in that order — a pin always explains inclusion first if true, then an actual
 * context-token match, then plain importance ranking. Never "the model decided." */
function determineRetrievalType(memory: Memory, contextText: string | undefined): RetrievalType {
  if (memory.pinned) return 'PINNED';
  if (contextText && contextText.trim().length > 0) {
    const contextTokens = new Set(significantTokens(contextText));
    const memoryTokens = significantTokens(`${memory.title} ${memory.summary}`);
    if (memoryTokens.some((token) => contextTokens.has(token))) return 'CONTEXT_MATCH';
  }
  return 'IMPORTANCE_RANKED';
}

function toRecommendedDto(memory: Memory, contextText: string | undefined, retrievalTimestamp: string): RecommendedMemoryDto {
  const factors = (memory.importanceFactors as Record<string, number> | null) ?? {};
  const explanations = explainImportanceFactors(factors);
  const hadContext = Boolean(contextText);

  const whyParts: string[] = [];
  if (memory.pinned) whyParts.push("you've pinned it");
  if (explanations.length > 0) whyParts.push(explanations[0]!.toLowerCase().replace(/\.$/, ''));
  if (hadContext) whyParts.push('it relates to what you were just discussing');
  const whyRecommended = whyParts.length > 0 ? `Surfaced because ${whyParts.join(' and ')}.` : 'Surfaced based on your memory history.';

  return {
    id: memory.id,
    type: memory.type,
    title: memory.title,
    summary: memory.summary,
    pinned: memory.pinned,
    importanceScore: memory.importanceScore,
    importanceExplanations: explanations,
    whyRecommended,
    retrievalType: determineRetrievalType(memory, contextText),
    retrievalTimestamp,
    sourceConversationId: memory.sourceConversationId,
    createdAt: memory.createdAt.toISOString(),
  };
}

function toSkippedDto(memory: Memory, reason: SkipReason): SkippedMemoryDto {
  return { id: memory.id, type: memory.type, title: memory.title, reason };
}
