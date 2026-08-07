import type { ReviewSectionTypeValue, ReviewStateValue, ReviewWindowValue } from '@beaconvie/types';
import type { BadgeVariant } from '@/components/ui/badge';

/** Plain-language labels only — never AI wording. See docs/architecture/review-engine.md. */
export const WINDOW_LABELS: Record<ReviewWindowValue, string> = {
  WEEK: 'Weekly',
  MONTH: 'Monthly',
  CUSTOM: 'Custom',
};

export const STATE_LABELS: Record<ReviewStateValue, string> = {
  NOT_READY: 'Not ready',
  READY: 'Ready',
  ARCHIVED: 'Archived',
};

export const STATE_BADGE_VARIANT: Record<ReviewStateValue, BadgeVariant> = {
  NOT_READY: 'neutral',
  READY: 'new',
  ARCHIVED: 'neutral',
};

export const SECTION_ICON_LABELS: Record<ReviewSectionTypeValue, string> = {
  HIGHLIGHTS: 'Highlights',
  CHANGES: 'Changes',
  ACHIEVEMENTS: 'Achievements',
  CHALLENGES: 'Challenges',
};

/** Reuses the same 7-value category dictionary Insight Experience already established
 * (`features/insight/labels.ts`) — Review evidence's own `category` column is always one of
 * these, so wording never drifts between the two surfaces. */
export const CATEGORY_LABELS: Record<string, string> = {
  GOAL: 'Goal',
  TOPIC: 'Recurring topic',
  JOURNAL: 'Journal theme',
  WELLBEING: 'Mood pattern',
  ALIGNMENT: 'Memory + journal alignment',
  MISMATCH: 'Goal + activity mismatch',
  INACTIVITY: 'Inactivity',
};

export const PRIORITY_BADGE_VARIANT: Record<'LOW' | 'MEDIUM' | 'HIGH', BadgeVariant> = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
};

export function priorityTierFor(priority: number): 'LOW' | 'MEDIUM' | 'HIGH' {
  if (priority >= 70) return 'HIGH';
  if (priority >= 40) return 'MEDIUM';
  return 'LOW';
}
