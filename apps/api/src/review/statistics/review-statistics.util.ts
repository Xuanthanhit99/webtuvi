import type { ReviewStatistics, ReviewUserData } from '../review.types';

/**
 * Phase 3 — Statistics. Pure functions over already-fetched real counts
 * (`sources/review-data-source.service.ts`) — no estimation, no AI. "Study streak" and "Completed
 * sessions" from the brief are disclosed substitutions (see sprint-5b-progress.md "Deliberate scope
 * decisions"): this product has no study/session-tracking feature, so they map to the closest real
 * concepts — a journaling streak and Companion conversation count — and are labeled as such, never
 * mislabeled "study" or "session".
 */

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Consecutive calendar days (UTC), ending on `asOf`'s own day and counting backward, with >= 1
 * PUBLISHED JournalEntry. Zero if `asOf`'s own day has no entry — a streak is never assumed to
 * include "today" without real evidence. `asOf` (not `windowEnd`) matters for an in-progress
 * `WEEK`/`MONTH`: `windowEnd` is the calendar period's future end, which never has journal entries
 * yet — see `review.types.ts` `ReviewUserData.asOf`. Mirrors the day-bucketing convention
 * `insight-renderer.ts`'s own `dayKey()` already uses. */
export function computeJournalingStreak(journalDays: string[], asOf: Date): number {
  const daySet = new Set(journalDays);
  let streak = 0;
  const cursor = new Date(Date.UTC(asOf.getUTCFullYear(), asOf.getUTCMonth(), asOf.getUTCDate()));
  while (daySet.has(dayKey(cursor))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

export function computeStatistics(data: ReviewUserData): ReviewStatistics {
  return {
    journalCount: data.counts.journalCount,
    memoryCreatedCount: data.counts.memoryCreatedCount,
    reflectionCount: data.counts.reflectionCount,
    insightCount: data.counts.insightCount,
    activityCount: data.counts.activityCount,
    journalingStreakDays: computeJournalingStreak(data.journalDays, data.asOf),
    companionConversationCount: data.counts.companionConversationCount,
  };
}
