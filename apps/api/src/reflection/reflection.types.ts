import type {
  ActivityEvent,
  ConversationMessage,
  JournalEntry,
  Memory,
  ReflectionCategory,
  ReflectionSourceType,
  ReflectionTrigger,
  ReflectionWindow,
} from '@prisma/client';

/**
 * Bounded, deterministic snapshot of one user's data across every Reflection data source
 * (Phase 2). Fetched once per generation pass by ReflectionDataSourceService and passed, by
 * reference, to every rule — never refetched per-rule, so all rules see the same consistent
 * snapshot. "Goals" are not a separate fetch: `goalMemories` is a filtered view of `memories`
 * (type GOAL/ACHIEVEMENT/CHALLENGE) — see docs/progress/sprint-4b-progress.md "Goals" note.
 */
export interface ReflectionGoalConflict {
  id: string;
  memoryAId: string;
  memoryBId: string;
  reason: string;
  detectedAt: Date;
}

export interface ReflectionUserData {
  userId: string;
  journals: JournalEntry[];
  memories: Memory[];
  goalMemories: Memory[];
  activityEvents: ActivityEvent[];
  companionMessages: ConversationMessage[];
  /** Existing MemoryConflict rows (Sprint 3B, status CONFLICT only — SUPERSEDED is a clear
   * replacement, not a regression) touching two goal-related memories, refreshed via
   * MemoryConflictService.detectForUser() — see reflection-data-source.service.ts. Reused, never
   * reimplemented. */
  goalConflicts: ReflectionGoalConflict[];
}

/** One real source record a rule is citing — never fabricated (Phase 1's own governing rule). */
export interface ReflectionSourceInput {
  sourceType: ReflectionSourceType;
  sourceId: string;
  sourceTimestamp: Date;
}

/** Inputs ReflectionScoreService needs that only the rule that fired can know honestly — e.g.
 * whether the underlying evidence is goal-relevant is a fact about *which* rule/sources this is,
 * not something the scorer should re-derive by re-inspecting content. */
export interface ReflectionScoreHints {
  importanceScore: number | null;
  isGoalRelevant: boolean;
  hasActivitySource: boolean;
  journalSourceCount: number;
}

/** The pure, deterministic output of one rule firing once for one group of evidence. A single
 * rule invocation may return zero or more findings (e.g. RepeatedTopicRule can fire once per
 * distinct topic cluster it finds). See ReflectionRuleEngine. */
export interface ReflectionRuleFinding {
  trigger: ReflectionTrigger;
  category: ReflectionCategory;
  window: ReflectionWindow;
  windowStart: Date;
  windowEnd: Date;
  /** Plain-language, deterministically templated — never free-text generation. */
  reason: string;
  /** Deterministic grouping key — see reflection-foundation.md "Grouping". */
  groupKey: string;
  sources: ReflectionSourceInput[];
  scoreHints: ReflectionScoreHints;
}
