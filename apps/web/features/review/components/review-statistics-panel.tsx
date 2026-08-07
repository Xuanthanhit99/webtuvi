'use client';

import type { ReviewStatisticsDto } from '@beaconvie/types';

const STAT_ITEMS: { key: keyof ReviewStatisticsDto; label: string }[] = [
  { key: 'journalCount', label: 'Journal entries' },
  { key: 'memoryCreatedCount', label: 'Memories saved' },
  { key: 'reflectionCount', label: 'Reflections' },
  { key: 'insightCount', label: 'Insights' },
  { key: 'activityCount', label: 'Activity events' },
  { key: 'journalingStreakDays', label: 'Journaling streak (days)' },
  { key: 'companionConversationCount', label: 'Companion conversations' },
];

/** Phase 3/4 — Review Statistics. Renders exactly the seven real counts the backend already
 * computed; never a derived/estimated number. "Journaling streak"/"Companion conversations" are
 * this product's real substitutions for the brief's "Study streak"/"Completed sessions" — see
 * docs/architecture/review-engine.md — labeled honestly, never as "study" or a fabricated
 * "session" concept. */
export function ReviewStatisticsPanel({ statistics }: { statistics: ReviewStatisticsDto }) {
  return (
    <dl className="grid grid-cols-2 gap-3 tablet:grid-cols-4" aria-label="Review statistics">
      {STAT_ITEMS.map((item) => (
        <div key={item.key} className="rounded-md border border-border-subtle bg-surface p-3">
          <dt className="text-caption text-text-disabled">{item.label}</dt>
          <dd className="font-display text-heading-md text-text-primary">{statistics[item.key]}</dd>
        </div>
      ))}
    </dl>
  );
}
