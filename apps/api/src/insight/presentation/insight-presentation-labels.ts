import type { InsightCategory, InsightStatus, ReflectionSourceType } from '@prisma/client';

/**
 * Plain-language labels only — never AI wording. These strings intentionally mirror
 * `apps/web/features/insight/labels.ts` (`CATEGORY_LABELS`/`STATUS_LABELS`) and
 * `apps/web/features/reflection/labels.ts` (`SOURCE_TYPE_LABELS`) exactly, so the internal
 * `/insights/internal` view (Sprint 4C, unchanged) and the new `/insights` Insight Experience
 * never disagree on what a category/status/source is called. If either copy changes, update both.
 */
export const INSIGHT_CATEGORY_LABELS: Record<InsightCategory, string> = {
  GOAL: 'Goal',
  TOPIC: 'Recurring topic',
  JOURNAL: 'Journal theme',
  WELLBEING: 'Mood pattern',
  ALIGNMENT: 'Memory + journal alignment',
  MISMATCH: 'Goal + activity mismatch',
  INACTIVITY: 'Inactivity',
};

export const INSIGHT_STATUS_LABELS: Record<InsightStatus, string> = {
  NOT_READY: 'Not ready',
  READY: 'Ready',
  INSUFFICIENT_EVIDENCE: 'Insufficient evidence',
  ARCHIVED: 'Archived',
};

export const INSIGHT_SOURCE_TYPE_LABELS: Record<ReflectionSourceType, string> = {
  JOURNAL: 'Journal entry',
  MEMORY: 'Memory',
  ACTIVITY: 'Activity',
  COMPANION: 'Companion conversation',
};
