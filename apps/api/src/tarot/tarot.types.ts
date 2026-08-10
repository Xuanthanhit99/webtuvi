import type { TarotCard, TarotReadingType } from '@prisma/client';

/** Phase 2/3 — internal shapes the draw/interpretation pipeline operates on. */

export interface DrawnCardWithData {
  card: TarotCard;
  position: number;
  positionLabel: string | null;
  isReversed: boolean;
}

/** Sprint 7 — the only two interpretation depths. FREE never receives a memory reference (that
 * lookup is skipped entirely, not merely hidden) and gets a shorter, simpler narration; PREMIUM
 * keeps Sprint 6's original behavior (at most one memory reference, richer narration). Both tiers
 * use the identical safety pipeline and the identical real, already-drawn cards — see
 * docs/architecture/premium-entitlements.md "AI interpretation gating". */
export type InterpretationTier = 'FREE' | 'PREMIUM';

/** Input to the interpretation layer (Phase 4) — every field is either a real drawn card's real
 * data or a real, already-accepted Memory's own text. Nothing here is invented. */
export interface InterpretationInput {
  readingType: TarotReadingType;
  question: string | null;
  cards: DrawnCardWithData[];
  tier: InterpretationTier;
  /** At most one — Module 12: "grounded in card DB + single most-relevant memory (never
   * multiple)". Null when no consented, relevant memory exists, or when `tier === 'FREE'` (memory
   * retrieval is skipped entirely for Free, never merely withheld after being fetched). */
  memoryReference: { title: string; summary: string } | null;
}
