import type { InsightCategoryValue, InsightRelationshipTypeValue, InsightStatusValue } from '@beaconvie/types';

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
