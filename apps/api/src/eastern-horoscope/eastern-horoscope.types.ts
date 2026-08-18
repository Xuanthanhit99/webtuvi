import type { HeavenlyStem, EarthlyBranch, FiveElement, YinYang } from './engine/eastern-horoscope-tables';
import type { YearEnergyRelationship } from './engine/eastern-horoscope-tables';

/** Phase — Sprint 8/16's Free/Premium interpretation-depth pattern, reused verbatim (see
 * `numerology.types.ts` `InterpretationTier`). The canonical birth profile is never gated (Product
 * Bible Module 14 §1: never withhold the deterministic result) — only interpretation depth and
 * history depth differ by tier. */
export type InterpretationTier = 'FREE' | 'PREMIUM';

export interface InterpretationInput {
  stem: HeavenlyStem;
  branch: EarthlyBranch;
  element: FiveElement;
  yinYang: YinYang;
  zodiacAnimal: { vi: string; en: string };
  yearEnergy: {
    calendarYear: number;
    yearStem: HeavenlyStem;
    yearElement: FiveElement;
    yearZodiacAnimal: { vi: string; en: string };
    relationship: YearEnergyRelationship;
  };
  tier: InterpretationTier;
  /** At most one — mirrors Tarot/Numerology's own "grounded in DB + single most-relevant memory"
   * rule. Null when no consented, relevant memory exists, or when `tier === 'FREE'`. */
  memoryReference: { title: string; summary: string } | null;
}
