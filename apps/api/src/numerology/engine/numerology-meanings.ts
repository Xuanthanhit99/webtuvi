import { NUMEROLOGY_VALUE_TYPES, type NumerologyValueType } from './numerology-engine';

/**
 * Phase E/Module 23 §10 — the deterministic, fixed-reference "Symbol Interpretation Engine".
 * Traditional numerology core-number meanings, grounded in standard/public-domain Pythagorean
 * numerology concepts (mirrors TarotCard's own original-but-traditionally-grounded meaning text
 * precedent — see docs/progress/sprint-6-progress.md "Deliberate scope decisions"). Never
 * AI-generated, never AI-editable — this is what "tap any number for its traditional symbolic
 * meaning" (Product Bible Module 15 §4) reads from. Editable in the future only through an Admin
 * content-curation process (Module 23 §10) — no such process exists yet, so this is a static,
 * versioned in-code table for Sprint 8.
 */
export const NUMEROLOGY_MEANINGS_VERSION = 'numerology-meanings-v1';

const CORE_NUMBER_MEANINGS: Record<number, { title: string; meaning: string }> = {
  1: { title: 'The Leader', meaning: 'Independence, initiative, and a drive to originate rather than follow.' },
  2: { title: 'The Peacemaker', meaning: 'Partnership, sensitivity, and a gift for cooperation and balance.' },
  3: { title: 'The Communicator', meaning: 'Creative self-expression, optimism, and social warmth.' },
  4: { title: 'The Builder', meaning: 'Discipline, structure, and a steady, practical approach to building something lasting.' },
  5: { title: 'The Free Spirit', meaning: 'Change, adaptability, and a pull toward variety and new experience.' },
  6: { title: 'The Caretaker', meaning: 'Responsibility, nurturing, and a focus on home, family, and service to others.' },
  7: { title: 'The Seeker', meaning: 'Introspection, analysis, and a search for deeper understanding beneath the surface.' },
  8: { title: 'The Achiever', meaning: 'Ambition, material accomplishment, and a natural sense for authority and organization.' },
  9: { title: 'The Humanitarian', meaning: 'Compassion, completion, and a broad, idealistic concern for others.' },
  11: { title: 'The Intuitive (Master Number)', meaning: 'Heightened intuition and inspiration — the amplified, more demanding expression of 2.' },
  22: { title: 'The Master Builder (Master Number)', meaning: 'The capacity to turn big visions into lasting, practical reality — the amplified, more demanding expression of 4.' },
  33: { title: 'The Master Teacher (Master Number)', meaning: 'Selfless service and compassion expressed on a larger scale — the amplified, more demanding expression of 6.' },
};

const TYPE_FRAMING: Record<NumerologyValueType, string> = {
  LIFE_PATH: 'Your Life Path Number describes the broad direction and lessons of your life.',
  EXPRESSION: 'Your Expression Number describes the natural talents and abilities you were born with.',
  SOUL_URGE: 'Your Soul Urge Number describes your inner motivation — what you genuinely want, beneath appearances.',
  PERSONALITY: 'Your Personality Number describes the impression you tend to make on others at first.',
  BIRTHDAY: 'Your Birthday Number describes a smaller, specific talent that supports your broader Life Path.',
  PERSONAL_YEAR: 'Your Personal Year Number describes the theme of the current calendar year for you.',
};

export interface NumerologyMeaning {
  type: NumerologyValueType;
  value: number;
  isMasterNumber: boolean;
  title: string;
  framing: string;
  meaning: string;
}

const MASTER_VALUES = new Set([11, 22, 33]);
const ALL_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33];

/** The full static table, every (type, value) pair this product supports — real reference data, no
 * placeholders (mirrors `TarotDeckService.list()`'s own "every row is real" precedent). */
export function listNumerologyMeanings(): NumerologyMeaning[] {
  const meanings: NumerologyMeaning[] = [];
  for (const type of NUMEROLOGY_VALUE_TYPES) {
    for (const value of ALL_VALUES) {
      const core = CORE_NUMBER_MEANINGS[value]!;
      meanings.push({ type, value, isMasterNumber: MASTER_VALUES.has(value), title: core.title, framing: TYPE_FRAMING[type], meaning: core.meaning });
    }
  }
  return meanings;
}

export function getNumerologyMeaning(type: NumerologyValueType, value: number): NumerologyMeaning | null {
  const core = CORE_NUMBER_MEANINGS[value];
  if (!core) return null;
  return { type, value, isMasterNumber: MASTER_VALUES.has(value), title: core.title, framing: TYPE_FRAMING[type], meaning: core.meaning };
}
