import type { InsightPriorityHints } from '../insight.types';

/**
 * Deterministic 0-100 scoring (Phase 4) — pure arithmetic, no AI, mirroring
 * ReflectionScoreService/MemoryImportanceCalculator's own documented-weights style exactly.
 *
 * | Factor | Weight | Trigger |
 * |---|---|---|
 * | Frequency | +6 per evidence reflection beyond the first, capped at +24 | `evidenceCount` |
 * | Consistency | +15 | the cluster contains a `CONTINUES` or `REPEATS` relationship |
 * | Consistency (fallback) | +6 | no `CONTINUES`/`REPEATS`, but >= 2 evidence share a category |
 * | Reflection score | up to +30 | `round(averageReflectionScore * 0.3)` |
 * | Goal relevance | +15 | the cluster's category is `GOAL`, or any evidence reflection is |
 * | Activity | +10 | any evidence reflection cites a real `ACTIVITY` source |
 * | Journal density | +4 per journal-backed evidence reflection, capped at +16 | `journalBackedEvidenceCount` |
 * | Memory importance | up to +20 | `round(averageMemoryImportance * 0.2)`, only when >= 1 evidence reflection cites a Memory source |
 *
 * Total is clamped to [0, 100]. No manual-pin floor exists this sprint (Insight Candidates have
 * no `pinned` field — Phase 1 doesn't ask for one, and inventing manual curation here would be
 * scope creep beyond "prepare structured evidence for Sprint 5").
 */
export interface InsightPriorityResult {
  priority: number;
  factors: Record<string, number>;
}

const FREQUENCY_PER_EVIDENCE = 6;
const FREQUENCY_CAP = 24;
const CONSISTENCY_STRONG = 15;
const CONSISTENCY_WEAK = 6;
const REFLECTION_SCORE_SCALE = 0.3;
const REFLECTION_SCORE_CAP = 30;
const GOAL_RELEVANCE_WEIGHT = 15;
const ACTIVITY_WEIGHT = 10;
const JOURNAL_DENSITY_PER_EVIDENCE = 4;
const JOURNAL_DENSITY_CAP = 16;
const MEMORY_IMPORTANCE_SCALE = 0.2;
const MEMORY_IMPORTANCE_CAP = 20;

export function calculateInsightPriority(hints: InsightPriorityHints): InsightPriorityResult {
  const factors: Record<string, number> = {};

  const frequency = Math.min(FREQUENCY_CAP, Math.max(0, hints.evidenceCount - 1) * FREQUENCY_PER_EVIDENCE);
  if (frequency > 0) factors.frequency = frequency;

  if (hints.hasContinuesOrRepeats) {
    factors.consistency = CONSISTENCY_STRONG;
  } else if (hints.sameCategoryCount >= 2) {
    factors.consistency = CONSISTENCY_WEAK;
  }

  const reflectionScore = Math.min(REFLECTION_SCORE_CAP, Math.round(hints.averageReflectionScore * REFLECTION_SCORE_SCALE));
  if (reflectionScore > 0) factors.reflectionScore = reflectionScore;

  if (hints.isGoalRelevant) factors.goalRelevance = GOAL_RELEVANCE_WEIGHT;
  if (hints.hasActivitySource) factors.activity = ACTIVITY_WEIGHT;

  const journalDensity = Math.min(JOURNAL_DENSITY_CAP, hints.journalBackedEvidenceCount * JOURNAL_DENSITY_PER_EVIDENCE);
  if (journalDensity > 0) factors.journalDensity = journalDensity;

  if (hints.averageMemoryImportance !== null) {
    const memoryImportance = Math.min(MEMORY_IMPORTANCE_CAP, Math.round(hints.averageMemoryImportance * MEMORY_IMPORTANCE_SCALE));
    if (memoryImportance > 0) factors.memoryImportance = memoryImportance;
  }

  const total = Object.values(factors).reduce((sum, v) => sum + v, 0);
  return { priority: Math.min(100, Math.max(0, total)), factors };
}

/** Converts the non-zero factor map into plain-language sentences, ordered by weighted
 * contribution descending — the single source of "why this priority" text, mirroring
 * explainReflectionScoreFactors so the wording never drifts. */
export function explainInsightPriorityFactors(factors: Record<string, number>): string[] {
  const labels: Record<string, (value: number) => string> = {
    frequency: (v) => `Backed by multiple related reflections (+${v}).`,
    consistency: (v) => `A consistent pattern over time (+${v}).`,
    reflectionScore: (v) => `Built on high-scoring reflections (+${v}).`,
    goalRelevance: (v) => `Relates to a goal (+${v}).`,
    activity: (v) => `Backed by real account activity (+${v}).`,
    journalDensity: (v) => `Shows up across several journal-backed reflections (+${v}).`,
    memoryImportance: (v) => `Involves memories you've marked important (+${v}).`,
  };

  return Object.entries(factors)
    .sort(([, a], [, b]) => b - a)
    .map(([key, value]) => labels[key]?.(value) ?? `${key} (+${value}).`);
}
