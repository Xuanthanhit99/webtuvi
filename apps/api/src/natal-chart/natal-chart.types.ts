import type { NatalChartPlanetKey } from './engine/natal-chart-constants';
import type { NatalAspectTypeKey, NatalZodiacSignKey } from './engine/natal-chart-calculator.service';

/** Phase 20 — same Free/Premium interpretation-depth pattern as Tarot/Numerology, reused
 * verbatim. The full calculated chart is never gated (Product Bible Module 2 §8) — only
 * interpretation depth, Memory personalization, and history depth differ by tier. */
export type InterpretationTier = 'FREE' | 'PREMIUM';

/** Phase 11 — the ten fixed, independently-renderable interpretation sections. */
export const NATAL_CHART_INTERPRETATION_SECTIONS = [
  'overview',
  'corePersonality',
  'emotionalWorld',
  'communication',
  'loveAndRelationships',
  'motivation',
  'careerDirection',
  'strengths',
  'challenges',
  'keyAspects',
] as const;
export type NatalChartInterpretationSectionKey = (typeof NATAL_CHART_INTERPRETATION_SECTIONS)[number];

export type NatalChartInterpretationSections = Record<NatalChartInterpretationSectionKey, string>;

export interface InterpretationPlacementFact {
  body: NatalChartPlanetKey;
  sign: NatalZodiacSignKey;
  house: number | null;
  retrograde: boolean;
  /** Composed fixed traditional meaning (`composePlacementMeaning`) — never AI-generated. */
  meaning: string;
}

export interface InterpretationAspectFact {
  pointA: string;
  pointB: string;
  type: NatalAspectTypeKey;
  orb: number;
  /** Composed fixed traditional meaning (`composeAspectMeaning`) — never AI-generated. */
  meaning: string;
}

export interface InterpretationAngleFact {
  sign: NatalZodiacSignKey;
  meaning: string;
}

export interface NatalChartInterpretationInput {
  placements: InterpretationPlacementFact[];
  housesAvailable: boolean;
  ascendant: InterpretationAngleFact | null;
  midheaven: InterpretationAngleFact | null;
  /** Bounded to the tightest-orb aspects only (`NATAL_CHART_INTERPRETATION_MAX_ASPECTS`) — never
   * an unbounded dump. */
  keyAspects: InterpretationAspectFact[];
  /** Nominatim-sourced, not fully trusted free text — checked via `SafetyService.checkInput()`
   * before it reaches the prompt, same discipline as Tarot/Numerology's own user-controlled
   * free-text fields. */
  birthPlaceLabel: string;
  tier: InterpretationTier;
  /** At most one — mirrors Tarot/Numerology's own "grounded in DB + single most-relevant memory"
   * rule. Null when no consented, relevant memory exists, or when `tier === 'FREE'`. */
  memoryReference: { title: string; summary: string } | null;
}
