import type { MemoryType } from '@prisma/client';
import type { RetrievalType, SkipReason } from '../../memory/retrieval/memory-retrieval.service';

/**
 * Sprint 3C, Phase 2 ("Memory References — no hidden retrieval"): every memory the Companion
 * actually used in a turn must carry all five of these fields. This is the Companion-facing
 * shape of `RecommendedMemoryDto` (Memory Intelligence, Sprint 3B) — same underlying data, but
 * without a raw summary field baked in (the prompt block below decides how much text reaches
 * the model; the reference itself is what gets shown to the *user* as a citation).
 */
export interface MemoryReferenceDto {
  memoryId: string;
  title: string;
  type: MemoryType;
  reason: string;
  retrievalType: RetrievalType;
  importance: { score: number; explanations: string[] };
  retrievalTimestamp: string;
  sourceConversationId: string | null;
  createdAt: string;
}

/** A memory that was found but deliberately not surfaced this turn, and why — Phase 8
 * ("Skipped Memory... No fabricated explanation"). */
export interface MemorySkipReferenceDto {
  memoryId: string;
  title: string;
  type: MemoryType;
  reason: SkipReason;
}

export interface AssembledMemoryContext {
  /** Null when there is nothing to include — the prompt is not padded with an empty section. */
  promptBlock: string | null;
  used: MemoryReferenceDto[];
  skipped: MemorySkipReferenceDto[];
  memoryTokenBudget: number;
  memoryTokenUsed: number;
}
