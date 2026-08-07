import type { GoalTrend } from '@prisma/client';
import type { GoalProgressFactors, GoalProgressInput, GoalProgressResult } from '../goal.types';

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

/** Phase 5 — an AUTOMATIC milestone completes deterministically once the goal's own real evidence
 * count reaches its `targetCount`. PENDING only; a FAILED/ARCHIVED milestone is never resurrected
 * by a later recompute (same "resolved decisions aren't re-litigated" precedent every prior engine
 * in this codebase uses). */
function evaluateAutomaticMilestones(milestones: GoalProgressInput['milestones'], evidenceCount: number): string[] {
  return milestones
    .filter((m) => m.type === 'AUTOMATIC' && m.status === 'PENDING' && m.targetCount !== null && evidenceCount >= m.targetCount)
    .map((m) => m.id);
}

function computeMilestoneCompletionPercent(milestones: GoalProgressInput['milestones'], milestonesToAutoComplete: string[]): number {
  if (milestones.length === 0) return 0;
  const autoCompleteSet = new Set(milestonesToAutoComplete);
  const completed = milestones.filter((m) => m.status === 'COMPLETED' || autoCompleteSet.has(m.id)).length;
  return clampPercent((completed / milestones.length) * 100);
}

function computeTrend(current: number, previous: number | null): GoalTrend {
  if (previous === null) return 'NEW';
  if (current > previous) return 'IMPROVING';
  if (current < previous) return 'DECLINING';
  return 'STABLE';
}

/**
 * Phase 3 — the one fixed, documented completion formula per `GoalType` (see
 * `sprint-5c-progress.md` "Deliberate scope decisions" #4). Pure, deterministic, no AI: every
 * output is either a real count or a real stored value, never inferred.
 */
export function computeGoalProgress(input: GoalProgressInput): GoalProgressResult {
  const milestonesToAutoComplete = evaluateAutomaticMilestones(input.milestones, input.evidenceCount);
  const milestoneCompletionPercent = computeMilestoneCompletionPercent(input.milestones, milestonesToAutoComplete);

  let completionPercent: number;
  let currentValue: number | null = null;

  switch (input.type) {
    case 'MILESTONE_BASED':
      completionPercent = milestoneCompletionPercent;
      break;
    case 'METRIC_BASED':
      currentValue = input.evidenceCount;
      completionPercent = input.targetValue && input.targetValue > 0 ? clampPercent((currentValue / input.targetValue) * 100) : 0;
      break;
    case 'BINARY':
      // Status transitions are always explicit user actions (sprint-5c-progress.md #5) — a BINARY
      // goal is never partially complete, and reaching evidence/milestone thresholds never
      // auto-completes it.
      completionPercent = input.status === 'COMPLETED' ? 100 : 0;
      break;
  }

  const factors: GoalProgressFactors = {
    formula: input.type,
    evidenceCount: input.evidenceCount,
    milestonesTotal: input.milestones.length,
    milestonesCompleted: input.milestones.filter((m) => m.status === 'COMPLETED' || milestonesToAutoComplete.includes(m.id)).length,
    targetValue: input.targetValue,
    currentValue,
  };

  return {
    completionPercent,
    milestoneCompletionPercent,
    trend: computeTrend(completionPercent, input.previousCompletionPercent),
    factors,
    milestonesToAutoComplete,
  };
}
