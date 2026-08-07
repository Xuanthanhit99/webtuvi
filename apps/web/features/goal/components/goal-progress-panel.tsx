import type { GoalProgressDto } from '@beaconvie/types';
import { ProgressLinear } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TREND_LABELS } from '../labels';

/** Phase 3 — every number here is either a real, already-stored value or the same input
 * `computeGoalProgress()` used, never recomputed client-side. `factors` is rendered verbatim so
 * "why this percentage" is always explainable (see docs/architecture/goal-system.md). */
export function GoalProgressPanel({ progress }: { progress: GoalProgressDto | null }) {
  if (!progress) return <p className="text-body-sm text-text-secondary">Progress hasn’t been computed yet.</p>;

  return (
    <div className="flex flex-col gap-4 rounded-md border border-border-subtle bg-surface p-4">
      <ProgressLinear value={progress.completionPercent} label="Overall completion" />
      <ProgressLinear value={progress.milestoneCompletionPercent} label="Milestones completed" />
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="insight">Trend: {TREND_LABELS[progress.trend]}</Badge>
        {progress.previousCompletionPercent !== null && (
          <span className="text-caption text-text-disabled">Previously {progress.previousCompletionPercent}%</span>
        )}
      </div>
      <div className="text-caption text-text-disabled">
        <p>Formula: {progress.factors.formula.toLowerCase().replace('_', ' ')}</p>
        <p>Evidence gathered: {progress.factors.evidenceCount}</p>
        <p>
          Milestones: {progress.factors.milestonesCompleted}/{progress.factors.milestonesTotal}
        </p>
        {progress.factors.targetValue !== null && (
          <p>
            Metric: {progress.factors.currentValue ?? 0}/{progress.factors.targetValue}
          </p>
        )}
      </div>
    </div>
  );
}
