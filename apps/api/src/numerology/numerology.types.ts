import type { NumerologyValueType } from './engine/numerology-engine';

/** Phase 8 — Sprint 7's Free/Premium interpretation-depth pattern, reused verbatim (see
 * tarot.types.ts InterpretationTier). Numerology's own core numbers and basic interpretation are
 * never gated (Product Bible Module 2 §8: all Discovery-system content is free) — only
 * interpretation depth and history depth differ by tier, exactly mirroring Tarot's own precedent
 * (see docs/architecture/premium-entitlements.md). */
export type InterpretationTier = 'FREE' | 'PREMIUM';

export interface InterpretationInput {
  normalizedBirthName: string;
  values: {
    type: NumerologyValueType;
    value: number;
    isMasterNumber: boolean;
  }[];
  tier: InterpretationTier;
  /** At most one — mirrors Tarot's own "grounded in DB + single most-relevant memory" rule
   * (Module 12/15). Null when no consented, relevant memory exists, or when `tier === 'FREE'`. */
  memoryReference: { title: string; summary: string } | null;
}

export { NUMEROLOGY_VALUE_TYPES, type NumerologyValueType } from './engine/numerology-engine';
