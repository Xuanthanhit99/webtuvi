import type { GoalSummaryDto } from '@beaconvie/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProgressLinear } from '@/components/ui/progress';
import { CATEGORY_LABELS, STATUS_BADGE_VARIANT, STATUS_LABELS, TREND_LABELS } from '../labels';

export function GoalCard({ goal, onSelect }: { goal: GoalSummaryDto; onSelect: (id: string) => void }) {
  const completion = goal.progress?.completionPercent ?? 0;
  return (
    <Card>
      <button type="button" onClick={() => onSelect(goal.id)} className="flex w-full flex-col gap-3 text-left">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-heading-sm text-text-primary">{goal.title}</h3>
          <div className="flex items-center gap-2">
            <Badge variant="neutral">{CATEGORY_LABELS[goal.category]}</Badge>
            <Badge variant={STATUS_BADGE_VARIANT[goal.status]}>{STATUS_LABELS[goal.status]}</Badge>
          </div>
        </div>
        {goal.description && <p className="text-body-sm text-text-secondary">{goal.description}</p>}
        <ProgressLinear value={completion} label="Progress" />
        {goal.progress && <p className="text-caption text-text-disabled">Trend: {TREND_LABELS[goal.progress.trend]}</p>}
      </button>
    </Card>
  );
}
