import type { InsightCandidate, InsightEvidence, JournalEntry, Memory, ReflectionCandidate, ReflectionSourceRef } from '@prisma/client';

/**
 * Phase 1/3 — the Review domain's own internal shapes. Nothing here is persisted verbatim (see
 * `Review.statistics` for the one embedded-JSON exception, mirroring `InsightCandidate.
 * priorityFactors`'s own precedent) — these are the inputs/outputs pure functions in
 * `builder/review-builder.util.ts` and `statistics/review-statistics.util.ts` operate on.
 */

export type InsightCandidateWithEvidence = InsightCandidate & {
  evidence: (InsightEvidence & { reflectionCandidate: ReflectionCandidate })[];
};

export type ReflectionCandidateWithSources = ReflectionCandidate & { sources: ReflectionSourceRef[] };

/** Bounded, deterministic snapshot one `ReviewGenerationService.ensureGenerated()` pass fetches —
 * mirrors `InsightUserData`'s own shape one layer up. */
export interface ReviewUserData {
  userId: string;
  windowStart: Date;
  windowEnd: Date;
  /** `min(windowEnd, now)` — the real point in time this snapshot was taken. A `WEEK`/`MONTH`
   * window's `windowEnd` is the *calendar* period's end, which is often still in the future for an
   * in-progress period; anchoring the journaling streak there would always compute 0 (no journal
   * entries exist for future dates yet). The streak is computed as of `asOf` instead — see
   * `statistics/review-statistics.util.ts` computeJournalingStreak(). */
  asOf: Date;
  /** READY InsightCandidates created within the window — Phase 2's primary evidence unit. */
  insights: InsightCandidateWithEvidence[];
  /** ReflectionCandidates created within the window that no fetched insight above already cites
   * as evidence (see `sources/review-data-source.service.ts` "loose reflections") — Phase 2's
   * supplementary evidence unit, satisfying "must consume ReflectionCandidate" directly, not only
   * transitively through Insight. */
  looseReflections: ReflectionCandidateWithSources[];
  /** Real `Memory` rows of type `ACHIEVEMENT` created in the window — a direct, deterministic
   * "consume Memory as evidence" path (not only via a ReflectionSourceRef or a statistics count).
   * The selection criterion is the memory's own real `type` field, never an arbitrary pick. */
  achievementMemories: Memory[];
  /** Real, user-`pinned` `JournalEntry` rows published in the window — the other direct "consume
   * Journal as evidence" path, gated on the user's own explicit pin flag (never an arbitrary
   * "most interesting entry" pick). */
  pinnedJournalEntries: JournalEntry[];
  /** Phase 3 raw counts — real rows only, never estimated. */
  counts: {
    journalCount: number;
    memoryCreatedCount: number;
    reflectionCount: number;
    insightCount: number;
    activityCount: number;
    companionConversationCount: number;
  };
  /** Distinct calendar days (UTC, `YYYY-MM-DD`) with >= 1 PUBLISHED JournalEntry, across a lookback
   * wide enough to compute a streak that may have started before `windowStart` — see
   * `statistics/review-statistics.util.ts` computeJournalingStreak(). */
  journalDays: string[];
}

export type ReviewSectionType = 'HIGHLIGHTS' | 'CHANGES' | 'ACHIEVEMENTS' | 'CHALLENGES';

/** One item classified into a section — either a real InsightCandidate or a real "loose"
 * ReflectionCandidate, never a fabricated item. */
export interface ReviewableItem {
  sourceType: 'INSIGHT' | 'REFLECTION' | 'MEMORY' | 'JOURNAL';
  sourceId: string;
  sourceTimestamp: Date;
  category: string;
  /** InsightCandidate.priority (0-100) or ReflectionCandidate.score (0-100) — already-computed,
   * never recomputed here. */
  priority: number;
  /** Plain-language, already-real text this item carries — InsightCandidate.ruleExplanation or
   * ReflectionCandidate.reason — copied, never rewritten. */
  reason: string;
  evidenceCount: number;
}

export interface ReviewStatistics {
  journalCount: number;
  memoryCreatedCount: number;
  reflectionCount: number;
  insightCount: number;
  activityCount: number;
  /** Disclosed substitution for the brief's "Study streak" — see sprint-5b-progress.md "Deliberate
   * scope decisions". Consecutive calendar days (ending on or before windowEnd) with >= 1
   * PUBLISHED JournalEntry. */
  journalingStreakDays: number;
  /** Disclosed substitution for the brief's "Completed sessions" — real Companion `Conversation`
   * rows created in the window. */
  companionConversationCount: number;
}

export interface ReviewSectionDraft {
  type: ReviewSectionType;
  title: string;
  summary: string;
  items: (ReviewableItem & { contribution: string })[];
}

export interface ReviewBuildResult {
  state: 'NOT_READY' | 'READY';
  overview: string;
  statistics: ReviewStatistics;
  sections: ReviewSectionDraft[];
}
