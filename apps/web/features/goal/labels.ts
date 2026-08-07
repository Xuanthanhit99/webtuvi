import type {
  GoalCategoryValue,
  GoalDifficultyValue,
  GoalEvidenceSourceTypeValue,
  GoalMilestoneStatusValue,
  GoalMilestoneTypeValue,
  GoalStatusValue,
  GoalTrendValue,
  GoalTypeValue,
} from '@beaconvie/types';
import type { BadgeVariant } from '@/components/ui/badge';

/** Plain-language labels only — never AI wording. See docs/architecture/goal-system.md. */
export const CATEGORY_LABELS: Record<GoalCategoryValue, string> = {
  LEARNING: 'Learning',
  CAREER: 'Career',
  HEALTH: 'Health',
  HABIT: 'Habit',
  RELATIONSHIP: 'Relationship',
  FINANCIAL: 'Financial',
  CREATIVE: 'Creative',
  PERSONAL: 'Personal',
  OTHER: 'Other',
};

export const TYPE_LABELS: Record<GoalTypeValue, string> = {
  MILESTONE_BASED: 'Milestone-based',
  METRIC_BASED: 'Metric-based',
  BINARY: 'Simple (done / not done)',
};

export const DIFFICULTY_LABELS: Record<GoalDifficultyValue, string> = {
  EASY: 'Easy',
  MEDIUM: 'Medium',
  HARD: 'Hard',
};

export const STATUS_LABELS: Record<GoalStatusValue, string> = {
  ACTIVE: 'Active',
  PAUSED: 'Paused',
  COMPLETED: 'Completed',
  ABANDONED: 'Abandoned',
  ARCHIVED: 'Archived',
  DELETED: 'Deleted',
};

export const STATUS_BADGE_VARIANT: Record<GoalStatusValue, BadgeVariant> = {
  ACTIVE: 'new',
  PAUSED: 'neutral',
  COMPLETED: 'high',
  ABANDONED: 'neutral',
  ARCHIVED: 'neutral',
  DELETED: 'neutral',
};

export const MILESTONE_STATUS_LABELS: Record<GoalMilestoneStatusValue, string> = {
  PENDING: 'Pending',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
  ARCHIVED: 'Archived',
};

export const MILESTONE_TYPE_LABELS: Record<GoalMilestoneTypeValue, string> = {
  AUTOMATIC: 'Automatic',
  MANUAL: 'Manual',
};

export const TREND_LABELS: Record<GoalTrendValue, string> = {
  NEW: 'New',
  IMPROVING: 'Improving',
  STABLE: 'Stable',
  DECLINING: 'Declining',
};

export const EVIDENCE_SOURCE_LABELS: Record<GoalEvidenceSourceTypeValue, string> = {
  JOURNAL: 'Journal',
  MEMORY: 'Memory',
  REFLECTION: 'Reflection',
  INSIGHT: 'Insight',
  REVIEW: 'Review',
  ACTIVITY: 'Activity',
};
