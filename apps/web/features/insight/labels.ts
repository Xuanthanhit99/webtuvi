import type { InsightCategoryValue, InsightPriorityTierValue, InsightRelationshipTypeValue, InsightStatusValue } from '@beaconvie/types';
import type { BadgeVariant } from '@/components/ui/badge';

/** Plain-language labels only — never AI wording. See docs/architecture/insight-preparation.md. */
export const CATEGORY_LABELS: Record<InsightCategoryValue, string> = {
  GOAL: 'Goal',
  TOPIC: 'Recurring topic',
  JOURNAL: 'Journal theme',
  WELLBEING: 'Mood pattern',
  ALIGNMENT: 'Memory + journal alignment',
  MISMATCH: 'Goal + activity mismatch',
  INACTIVITY: 'Inactivity',
};

export const STATUS_LABELS: Record<InsightStatusValue, string> = {
  NOT_READY: 'Not ready',
  READY: 'Ready',
  INSUFFICIENT_EVIDENCE: 'Insufficient evidence',
  ARCHIVED: 'Archived',
};

export const RELATIONSHIP_LABELS: Record<InsightRelationshipTypeValue, string> = {
  SUPPORTS: 'Supports',
  CONTRADICTS: 'Contradicts',
  CONTINUES: 'Continues',
  REPEATS: 'Repeats',
  IMPROVES: 'Improves',
  REGRESSES: 'Regresses',
  STAGNATES: 'Stagnates',
};

/** Insight Experience (Sprint 5A) — UI-only mapping from a rendered card's fields to a `Badge`
 * variant. Never a second copy of label text: `InsightCardDto` already carries the label strings
 * (`category.label`/`status.label`/`priorityBadge.label`) from the backend renderer. */
export const STATUS_BADGE_VARIANT: Record<InsightStatusValue, BadgeVariant> = {
  NOT_READY: 'neutral',
  READY: 'new',
  INSUFFICIENT_EVIDENCE: 'neutral',
  ARCHIVED: 'neutral',
};

export const PRIORITY_BADGE_VARIANT: Record<InsightPriorityTierValue, BadgeVariant> = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
};
