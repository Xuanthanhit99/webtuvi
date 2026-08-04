import type { MemorySourceType, MemoryType } from '@prisma/client';

/**
 * Pure, deterministic importance scoring — no AI, no DI, no I/O. See
 * docs/architecture/memory-intelligence.md "Importance algorithm" for the authoritative,
 * documented weight table this file implements. Every weight below must match that doc
 * exactly; if you change one, update the doc in the same change.
 */
export interface ImportanceCalculatorInput {
  type: MemoryType;
  sourceType: MemorySourceType;
  pinned: boolean;
  /** True if the memory's structuredPayload explicitly marks emphasis (e.g. captured from a
   * "this matters to me" signal at candidate-creation time). Defaults false when unknown. */
  explicitEmphasis: boolean;
  /** True if structuredPayload explicitly marks future relevance. Defaults false when unknown. */
  explicitFutureRelevance: boolean;
  /** How many other ACCEPTED memories for this user are near-duplicates/reinforcements of
   * this one (see MemoryDuplicateService) — a fact repeated across conversations scores higher. */
  recurrenceCount: number;
  createdAt: Date;
  lastReferencedAt: Date | null;
  now?: Date;
}

export interface ImportanceScoreResult {
  /** 0-100, clamped. */
  score: number;
  /** Non-zero weighted contributions only, keyed by factor name — the frontend renders this
   * as "why this memory is important" instead of the raw score alone (Phase 10 requirement). */
  factors: Record<string, number>;
}

const WEIGHTS = {
  MANUAL_PIN: 35,
  EXPLICIT_EMPHASIS: 15,
  FUTURE_RELEVANCE: 12,
  RECURRENCE_PER_OCCURRENCE: 4,
  RECURRENCE_CAP: 16,
  GOAL_RELATION: 10,
  PREFERENCE_RELATION: 6,
  LIFE_EVENT: 14,
  LONG_TERM_USEFULNESS: 10,
  RECENCY_MAX: 10,
  RECENCY_DECAY_PERIOD_DAYS: 15,
  USER_CREATED_SOURCE: 8,
} as const;

/** A pinned memory is floored at this score regardless of its other factors — a manual pin is
 * the one direct user action in this algorithm and must never be out-ranked by inference. */
const PINNED_FLOOR = 80;

const GOAL_RELATION_TYPES = new Set<MemoryType>(['GOAL', 'ACHIEVEMENT', 'CHALLENGE']);
const PREFERENCE_RELATION_TYPES = new Set<MemoryType>(['PREFERENCE', 'INTEREST', 'LOCATION_PREFERENCE']);
const LIFE_EVENT_TYPES = new Set<MemoryType>(['IMPORTANT_EVENT']);
const LONG_TERM_USEFULNESS_TYPES = new Set<MemoryType>([
  'IDENTITY',
  'RELATIONSHIP',
  'HABIT',
  'ROUTINE',
  'WORK',
  'STUDY',
  'PET',
]);
const FUTURE_RELEVANCE_TYPES = new Set<MemoryType>(['GOAL', 'DECISION']);
const USER_CREATED_SOURCE_TYPES = new Set<MemorySourceType>(['USER_EXPLICIT', 'COMPANION', 'ONBOARDING']);

export class MemoryImportanceCalculator {
  /** Computes the 0-100 importance score and its factor breakdown for one memory. Calling this
   * twice with the same input always returns the same result — no randomness, no external state. */
  static calculate(input: ImportanceCalculatorInput): ImportanceScoreResult {
    const factors: Record<string, number> = {};
    const now = input.now ?? new Date();

    if (input.pinned) {
      factors.manualPin = WEIGHTS.MANUAL_PIN;
    }

    if (input.explicitEmphasis || input.sourceType === 'USER_EXPLICIT') {
      factors.explicitEmphasis = WEIGHTS.EXPLICIT_EMPHASIS;
    }

    if (input.explicitFutureRelevance || FUTURE_RELEVANCE_TYPES.has(input.type)) {
      factors.futureRelevance = WEIGHTS.FUTURE_RELEVANCE;
    }

    if (input.recurrenceCount > 0) {
      factors.recurrence = Math.min(
        input.recurrenceCount * WEIGHTS.RECURRENCE_PER_OCCURRENCE,
        WEIGHTS.RECURRENCE_CAP,
      );
    }

    if (GOAL_RELATION_TYPES.has(input.type)) {
      factors.goalRelation = WEIGHTS.GOAL_RELATION;
    }

    if (PREFERENCE_RELATION_TYPES.has(input.type)) {
      factors.preferenceRelation = WEIGHTS.PREFERENCE_RELATION;
    }

    if (LIFE_EVENT_TYPES.has(input.type)) {
      factors.lifeEvent = WEIGHTS.LIFE_EVENT;
    }

    if (LONG_TERM_USEFULNESS_TYPES.has(input.type)) {
      factors.longTermUsefulness = WEIGHTS.LONG_TERM_USEFULNESS;
    }

    const recencyScore = computeRecencyScore(input.lastReferencedAt ?? input.createdAt, now);
    if (recencyScore > 0) {
      factors.recency = recencyScore;
    }

    if (USER_CREATED_SOURCE_TYPES.has(input.sourceType)) {
      factors.userCreatedSource = WEIGHTS.USER_CREATED_SOURCE;
    }

    const rawTotal = Object.values(factors).reduce((sum, value) => sum + value, 0);
    const clamped = Math.max(0, Math.min(100, rawTotal));
    const score = input.pinned ? Math.max(clamped, PINNED_FLOOR) : clamped;

    return { score, factors };
  }
}

function computeRecencyScore(referenceDate: Date, now: Date): number {
  const daysSince = Math.max(0, (now.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));
  const decaySteps = Math.floor(daysSince / WEIGHTS.RECENCY_DECAY_PERIOD_DAYS);
  return Math.max(0, WEIGHTS.RECENCY_MAX - decaySteps);
}

/** Shared with MemoryRankingUtil's "goal relation" ranking factor (Phase 7) — kept as one
 * exported source of truth so the importance weight table and the ranking tie-break rule can
 * never silently disagree on which types count as goal-related. */
export function isGoalRelatedType(type: MemoryType): boolean {
  return GOAL_RELATION_TYPES.has(type);
}

const FACTOR_EXPLANATIONS: Record<string, (value: number) => string> = {
  manualPin: () => 'You pinned this memory.',
  explicitEmphasis: () => 'You explicitly asked BeaconVie to remember this.',
  futureRelevance: () => 'This relates to a goal or a decision you made.',
  recurrence: (value) =>
    `You've mentioned this again (${Math.round(value / WEIGHTS.RECURRENCE_PER_OCCURRENCE)} related ${
      value / WEIGHTS.RECURRENCE_PER_OCCURRENCE === 1 ? 'memory' : 'memories'
    }).`,
  goalRelation: () => 'This relates to a goal, achievement, or challenge.',
  preferenceRelation: () => 'This reflects a preference or interest of yours.',
  lifeEvent: () => 'This marks an important event in your life.',
  longTermUsefulness: () => 'This is the kind of fact that stays useful over time.',
  recency: () => "It's from recently.",
  userCreatedSource: () => 'You created this directly, rather than it being carried over.',
};

/** Plain-language sentences, one per non-zero factor, ordered by weighted contribution
 * descending — the single source both ImportanceScoringService and MemoryRetrievalService use
 * so "why this memory is important" is worded identically everywhere it's shown (Phase 10). */
export function explainImportanceFactors(factors: Record<string, number>): string[] {
  return Object.entries(factors)
    .sort(([, a], [, b]) => b - a)
    .map(([factor, value]) => FACTOR_EXPLANATIONS[factor]?.(value) ?? factor);
}

export { WEIGHTS as IMPORTANCE_WEIGHTS, PINNED_FLOOR as IMPORTANCE_PINNED_FLOOR };
