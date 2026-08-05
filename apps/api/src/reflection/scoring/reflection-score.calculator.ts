import type { ReflectionScoreHints } from '../reflection.types';

/**
 * Deterministic 0-100 scoring (Phase 5) — pure arithmetic, no AI, mirroring
 * MemoryImportanceCalculator's (Sprint 3B) documented-weights style exactly. See
 * docs/architecture/reflection-foundation.md "Scoring" for the full rationale.
 *
 * | Factor | Weight | Trigger |
 * |---|---|---|
 * | Frequency | +6 per source beyond the first | `sourceCount`, capped at +24 |
 * | Recency | up to +20, -2 per day since the evidence window ended | floor 0 |
 * | Importance | up to +20 | `round(avg Memory.importanceScore among sources * 0.2)` |
 * | Goal relevance | +15 | the finding's evidence involves a goal-related memory |
 * | Journal density | +4 per distinct journal source | capped at +16 |
 * | Activity | +10 | an ActivityEvent is among the cited sources |
 * | Manual pin | floors the total at 70 | `pinned === true` (the one direct user-action input) |
 *
 * A pinned candidate is floored at 70 (never silently out-ranked by inference) but can still
 * exceed 70 if its other factors push it higher — same non-negotiable-floor pattern Memory's own
 * pin factor uses. All other factors are additive with no floor.
 */
export interface ReflectionScoreInput {
  sourceCount: number;
  daysSinceWindowEnd: number;
  hints: ReflectionScoreHints;
  pinned: boolean;
}

export interface ReflectionScoreResult {
  score: number;
  factors: Record<string, number>;
}

const FREQUENCY_PER_SOURCE = 6;
const FREQUENCY_CAP = 24;
const RECENCY_MAX = 20;
const RECENCY_DECAY_PER_DAY = 2;
const IMPORTANCE_SCALE = 0.2;
const GOAL_RELEVANCE_WEIGHT = 15;
const JOURNAL_DENSITY_PER_ENTRY = 4;
const JOURNAL_DENSITY_CAP = 16;
const ACTIVITY_WEIGHT = 10;
const PIN_FLOOR = 70;

export function calculateReflectionScore(input: ReflectionScoreInput): ReflectionScoreResult {
  const factors: Record<string, number> = {};

  const frequency = Math.min(FREQUENCY_CAP, Math.max(0, input.sourceCount - 1) * FREQUENCY_PER_SOURCE);
  if (frequency > 0) factors.frequency = frequency;

  const recency = Math.max(0, RECENCY_MAX - Math.max(0, input.daysSinceWindowEnd) * RECENCY_DECAY_PER_DAY);
  if (recency > 0) factors.recency = Math.round(recency);

  if (input.hints.importanceScore !== null) {
    const importance = Math.round(input.hints.importanceScore * IMPORTANCE_SCALE);
    if (importance > 0) factors.importance = importance;
  }

  if (input.hints.isGoalRelevant) factors.goalRelevance = GOAL_RELEVANCE_WEIGHT;

  const journalDensity = Math.min(JOURNAL_DENSITY_CAP, input.hints.journalSourceCount * JOURNAL_DENSITY_PER_ENTRY);
  if (journalDensity > 0) factors.journalDensity = journalDensity;

  if (input.hints.hasActivitySource) factors.activity = ACTIVITY_WEIGHT;

  let total = Object.values(factors).reduce((sum, v) => sum + v, 0);
  total = Math.min(100, Math.max(0, total));

  // Pinning floors the total at PIN_FLOOR but never lowers a score that already exceeds it — the
  // factor recorded is the actual boost applied, so "why this score" stays honest about what pin
  // contributed rather than claiming credit for factors that already cleared the floor.
  if (input.pinned && total < PIN_FLOOR) {
    factors.manualPin = PIN_FLOOR - total;
    total = PIN_FLOOR;
  }

  return { score: Math.min(100, Math.max(0, total)), factors };
}

/** Converts the non-zero factor map into plain-language sentences, ordered by weighted
 * contribution descending — the single source of "why this score" text (mirrors
 * MemoryImportanceCalculator.explainImportanceFactors so the wording never drifts). */
export function explainReflectionScoreFactors(factors: Record<string, number>): string[] {
  const labels: Record<string, (value: number) => string> = {
    frequency: (v) => `Backed by multiple related entries (+${v}).`,
    recency: (v) => `Recently observed (+${v}).`,
    importance: (v) => `Involves memories you've marked important (+${v}).`,
    goalRelevance: (v) => `Relates to one of your goals (+${v}).`,
    journalDensity: (v) => `Shows up across several journal entries (+${v}).`,
    activity: (v) => `Backed by real account activity, not just words (+${v}).`,
    manualPin: () => `You pinned this reflection.`,
  };

  return Object.entries(factors)
    .sort(([, a], [, b]) => b - a)
    .map(([key, value]) => labels[key]?.(value) ?? `${key} (+${value}).`);
}
