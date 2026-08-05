import type {
  ReflectionCategoryValue,
  ReflectionSourceTypeValue,
  ReflectionStateValue,
  ReflectionTimelineBucketValue,
  ReflectionTriggerValue,
} from '@beaconvie/types';

/** Plain-language labels only — never AI wording, never a claim of understanding emotions. See
 * docs/architecture/reflection-foundation.md "Feed". */
export const CATEGORY_LABELS: Record<ReflectionCategoryValue, string> = {
  GOAL: 'Goal',
  TOPIC: 'Recurring topic',
  JOURNAL: 'Journal theme',
  WELLBEING: 'Mood pattern',
  ALIGNMENT: 'Memory + journal alignment',
  MISMATCH: 'Goal + activity mismatch',
  INACTIVITY: 'Inactivity',
};

export const TRIGGER_LABELS: Record<ReflectionTriggerValue, string> = {
  REPEATED_TOPIC: 'Repeated topic',
  REPEATED_GOAL: 'Repeated goal',
  LONG_INACTIVITY: 'Long inactivity',
  GOAL_REGRESSION: 'Goal regression',
  POSITIVE_STREAK: 'Positive streak',
  NEGATIVE_STREAK: 'Negative streak',
  REPEATED_JOURNAL_THEME: 'Repeated journal theme',
  MEMORY_JOURNAL_ALIGNMENT: 'Memory + journal alignment',
  GOAL_ACTIVITY_MISMATCH: 'Goal + activity mismatch',
};

export const STATE_LABELS: Record<ReflectionStateValue, string> = {
  NEW: 'New',
  READY: 'Active',
  DISMISSED: 'Dismissed',
  ARCHIVED: 'Archived',
  EXPIRED: 'Expired',
};

export const BUCKET_LABELS: Record<ReflectionTimelineBucketValue, string> = {
  today: 'Today',
  this_week: 'This week',
  last_week: 'Last week',
  last_month: 'Last month',
  earlier: 'Earlier',
};

export const SOURCE_TYPE_LABELS: Record<ReflectionSourceTypeValue, string> = {
  JOURNAL: 'Journal entry',
  MEMORY: 'Memory',
  ACTIVITY: 'Activity',
  COMPANION: 'Companion conversation',
};
