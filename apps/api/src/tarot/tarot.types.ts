import type { TarotCard, TarotReadingType } from '@prisma/client';

/** Phase 2/3 — internal shapes the draw/interpretation pipeline operates on. */

export interface DrawnCardWithData {
  card: TarotCard;
  position: number;
  positionLabel: string | null;
  isReversed: boolean;
}

/** Input to the interpretation layer (Phase 4) — every field is either a real drawn card's real
 * data or a real, already-accepted Memory's own text. Nothing here is invented. */
export interface InterpretationInput {
  readingType: TarotReadingType;
  question: string | null;
  cards: DrawnCardWithData[];
  /** At most one — Module 12: "grounded in card DB + single most-relevant memory (never
   * multiple)". Null when no consented, relevant memory exists. */
  memoryReference: { title: string; summary: string } | null;
}
