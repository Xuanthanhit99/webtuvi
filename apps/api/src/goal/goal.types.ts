import type { GoalMilestoneStatus, GoalMilestoneType, GoalStatus, GoalTrend, GoalType } from '@prisma/client';

/**
 * Phase 3 — the Progress Engine's own internal shapes. Nothing here is persisted verbatim except
 * via `GoalProgress.factors` (embedded JSON, mirroring `InsightCandidate.priorityFactors`'s own
 * "structural breakdown, not recomputed by the frontend" precedent) — these are the inputs/outputs
 * the pure functions in `progress/goal-progress.util.ts` operate on.
 */

export interface GoalEvidenceCandidate {
  sourceType: 'JOURNAL' | 'MEMORY' | 'REFLECTION' | 'INSIGHT' | 'REVIEW';
  sourceId: string;
  sourceTimestamp: Date;
  contribution: string;
}

/** Bounded, deterministic snapshot `GoalDataSourceService.fetch()` gathers for one goal — see
 * `sprint-5c-progress.md` "Evidence linking" for the exact, real tag/category-equality rule per
 * source type. Never semantic/AI matching. */
export interface GoalUserData {
  evidence: GoalEvidenceCandidate[];
}

export interface GoalMilestoneSnapshot {
  id: string;
  type: GoalMilestoneType;
  status: GoalMilestoneStatus;
  targetCount: number | null;
}

/** Input to the pure `computeGoalProgress()` — everything the formula needs, already fetched. */
export interface GoalProgressInput {
  type: GoalType;
  status: GoalStatus;
  targetValue: number | null;
  milestones: GoalMilestoneSnapshot[];
  evidenceCount: number;
  previousCompletionPercent: number | null;
}

export interface GoalProgressFactors {
  formula: 'MILESTONE_BASED' | 'METRIC_BASED' | 'BINARY';
  evidenceCount: number;
  milestonesTotal: number;
  milestonesCompleted: number;
  targetValue: number | null;
  currentValue: number | null;
}

export interface GoalProgressResult {
  completionPercent: number;
  milestoneCompletionPercent: number;
  trend: GoalTrend;
  factors: GoalProgressFactors;
  /** ids of PENDING AUTOMATIC milestones whose targetCount has now been reached — the caller
   * transitions these to COMPLETED in the same pass, never a separate heuristic. */
  milestonesToAutoComplete: string[];
}
