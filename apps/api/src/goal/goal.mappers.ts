import type { Goal, GoalEvidence, GoalHistory, GoalMilestone, GoalProgress, GoalRelationship } from '@prisma/client';
import type { GoalProgressFactors } from './goal.types';

export interface GoalEvidenceDto {
  sourceType: GoalEvidence['sourceType'];
  sourceId: string;
  sourceTimestamp: string;
  contribution: string;
  /** Deep link back to the real record — mirrors Review Evidence's own evidence-link rule. */
  href: string;
}

export interface GoalProgressDto {
  completionPercent: number;
  milestoneCompletionPercent: number;
  trend: GoalProgress['trend'];
  factors: GoalProgressFactors;
  previousCompletionPercent: number | null;
  computedAt: string;
  evidence: GoalEvidenceDto[];
}

export interface GoalMilestoneDto {
  id: string;
  title: string;
  description: string;
  type: GoalMilestone['type'];
  status: GoalMilestone['status'];
  order: number;
  targetCount: number | null;
  dueDate: string | null;
  completedAt: string | null;
  failedAt: string | null;
}

export interface GoalHistoryDto {
  id: string;
  action: GoalHistory['action'];
  detail: string;
  createdAt: string;
}

export interface GoalRelationshipDto {
  id: string;
  type: GoalRelationship['type'];
  goalId: string;
  goalTitle: string;
  /** Whether the caller's own goal is the "parent" side of a PARENT_CHILD relationship. */
  direction: 'A' | 'B';
}

export interface GoalSummaryDto {
  id: string;
  title: string;
  description: string;
  category: Goal['category'];
  type: Goal['type'];
  difficulty: Goal['difficulty'];
  status: Goal['status'];
  visibility: Goal['visibility'];
  linkedTag: string;
  targetValue: number | null;
  targetUnit: string | null;
  targetDate: string | null;
  startedAt: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  progress: GoalProgressDto | null;
  milestones: GoalMilestoneDto[];
}

function hrefFor(sourceType: GoalEvidence['sourceType'], sourceId: string): string {
  switch (sourceType) {
    case 'JOURNAL':
      return `/journal?item=${sourceId}`;
    case 'MEMORY':
      return `/memory?item=${sourceId}`;
    case 'REFLECTION':
      return `/reflections?item=${sourceId}`;
    case 'INSIGHT':
      return `/insights?item=${sourceId}`;
    case 'REVIEW':
      return `/reviews/${sourceId}`;
    case 'ACTIVITY':
      return `/dashboard`;
  }
}

function toGoalEvidenceDto(evidence: GoalEvidence): GoalEvidenceDto {
  return {
    sourceType: evidence.sourceType,
    sourceId: evidence.sourceId,
    sourceTimestamp: evidence.sourceTimestamp.toISOString(),
    contribution: evidence.contribution,
    href: hrefFor(evidence.sourceType, evidence.sourceId),
  };
}

export function toGoalProgressDto(progress: (GoalProgress & { evidence: GoalEvidence[] }) | null): GoalProgressDto | null {
  if (!progress) return null;
  return {
    completionPercent: progress.completionPercent,
    milestoneCompletionPercent: progress.milestoneCompletionPercent,
    trend: progress.trend,
    factors: progress.factors as unknown as GoalProgressFactors,
    previousCompletionPercent: progress.previousCompletionPercent,
    computedAt: progress.computedAt.toISOString(),
    evidence: [...progress.evidence].sort((a, b) => b.sourceTimestamp.getTime() - a.sourceTimestamp.getTime()).map(toGoalEvidenceDto),
  };
}

export function toGoalMilestoneDto(milestone: GoalMilestone): GoalMilestoneDto {
  return {
    id: milestone.id,
    title: milestone.title,
    description: milestone.description,
    type: milestone.type,
    status: milestone.status,
    order: milestone.order,
    targetCount: milestone.targetCount,
    dueDate: milestone.dueDate?.toISOString() ?? null,
    completedAt: milestone.completedAt?.toISOString() ?? null,
    failedAt: milestone.failedAt?.toISOString() ?? null,
  };
}

export function toGoalHistoryDto(entry: GoalHistory): GoalHistoryDto {
  return { id: entry.id, action: entry.action, detail: entry.detail, createdAt: entry.createdAt.toISOString() };
}

/** The one shape every Goal surface renders — mirrors `toReviewSummaryDto`'s own "single source of
 * truth" discipline exactly. */
export function toGoalSummaryDto(
  goal: Goal & { milestones: GoalMilestone[]; progress: (GoalProgress & { evidence: GoalEvidence[] }) | null },
): GoalSummaryDto {
  return {
    id: goal.id,
    title: goal.title,
    description: goal.description,
    category: goal.category,
    type: goal.type,
    difficulty: goal.difficulty,
    status: goal.status,
    visibility: goal.visibility,
    linkedTag: goal.linkedTag,
    targetValue: goal.targetValue,
    targetUnit: goal.targetUnit,
    targetDate: goal.targetDate?.toISOString() ?? null,
    startedAt: goal.startedAt.toISOString(),
    completedAt: goal.completedAt?.toISOString() ?? null,
    createdAt: goal.createdAt.toISOString(),
    updatedAt: goal.updatedAt.toISOString(),
    archivedAt: goal.archivedAt?.toISOString() ?? null,
    progress: toGoalProgressDto(goal.progress),
    milestones: [...goal.milestones].sort((a, b) => a.order - b.order).map(toGoalMilestoneDto),
  };
}
