'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { toast } from '@/components/ui/toast';
import { goalApi } from '../api/goal-api';
import { GoalProgressPanel } from './goal-progress-panel';
import { GoalMilestoneList } from './goal-milestone-list';
import { GoalEvidenceList } from './goal-evidence-list';
import { GoalHistoryList } from './goal-history-list';
import { CATEGORY_LABELS, DIFFICULTY_LABELS, STATUS_BADGE_VARIANT, STATUS_LABELS, TYPE_LABELS } from '../labels';

/** Phase 6/2 — a goal's detail view: overview, Progress, Milestones, Evidence, History, and every
 * explicit lifecycle action (Phase 2) gated to only the transitions the current status allows —
 * mirrors `ReviewContent`'s own "only show Archive when not already archived" discipline, extended
 * to the full pause/resume/complete/abandon/archive/delete/restore set. */
export function GoalDetail({ id, onClose }: { id: string; onClose: () => void }) {
  const queryClient = useQueryClient();

  const { data: goal, isLoading, isError, refetch } = useQuery({ queryKey: ['goals', id], queryFn: () => goalApi.get(id) });
  const { data: history } = useQuery({ queryKey: ['goals', id, 'history'], queryFn: () => goalApi.history(id), enabled: !!goal });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['goals', id] });

  const pause = useMutation({ mutationFn: () => goalApi.pause(id), onSuccess: invalidate, onError: () => toast.error("Couldn't pause that goal.") });
  const resume = useMutation({ mutationFn: () => goalApi.resume(id), onSuccess: invalidate, onError: () => toast.error("Couldn't resume that goal.") });
  const complete = useMutation({ mutationFn: () => goalApi.complete(id), onSuccess: invalidate, onError: () => toast.error("Couldn't complete that goal.") });
  const abandon = useMutation({ mutationFn: () => goalApi.abandon(id), onSuccess: invalidate, onError: () => toast.error("Couldn't abandon that goal.") });
  const archive = useMutation({
    mutationFn: () => goalApi.archive(id),
    onSuccess: () => {
      invalidate();
      toast.success('Goal archived.');
    },
    onError: () => toast.error("Couldn't archive that goal."),
  });
  const remove = useMutation({
    mutationFn: () => goalApi.remove(id),
    onSuccess: () => {
      invalidate();
      toast.success('Goal deleted.');
    },
    onError: () => toast.error("Couldn't delete that goal."),
  });
  const restore = useMutation({
    mutationFn: () => goalApi.restore(id),
    onSuccess: () => {
      invalidate();
      toast.success('Goal restored.');
    },
    onError: () => toast.error("Couldn't restore that goal."),
  });

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (isError || !goal) return <ErrorState description="Couldn't load that goal." onRetry={() => refetch()} />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 rounded-md border border-border-subtle bg-surface p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" size="sm" onClick={onClose}>
            ← Back to Goals
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            {goal.status === 'ACTIVE' && (
              <>
                <Button variant="secondary" size="sm" onClick={() => pause.mutate()} loading={pause.isPending}>
                  Pause
                </Button>
                <Button variant="secondary" size="sm" onClick={() => complete.mutate()} loading={complete.isPending}>
                  Complete
                </Button>
                <Button variant="ghost" size="sm" onClick={() => abandon.mutate()} loading={abandon.isPending}>
                  Abandon
                </Button>
              </>
            )}
            {goal.status === 'PAUSED' && (
              <>
                <Button variant="secondary" size="sm" onClick={() => resume.mutate()} loading={resume.isPending}>
                  Resume
                </Button>
                <Button variant="secondary" size="sm" onClick={() => complete.mutate()} loading={complete.isPending}>
                  Complete
                </Button>
                <Button variant="ghost" size="sm" onClick={() => abandon.mutate()} loading={abandon.isPending}>
                  Abandon
                </Button>
              </>
            )}
            {['ACTIVE', 'PAUSED', 'COMPLETED', 'ABANDONED'].includes(goal.status) && (
              <Button variant="ghost" size="sm" onClick={() => archive.mutate()} loading={archive.isPending}>
                Archive
              </Button>
            )}
            {goal.status !== 'DELETED' && (
              <Button variant="ghost" size="sm" onClick={() => remove.mutate()} loading={remove.isPending}>
                Delete
              </Button>
            )}
            {(goal.status === 'ARCHIVED' || goal.status === 'DELETED') && (
              <Button variant="secondary" size="sm" onClick={() => restore.mutate()} loading={restore.isPending}>
                Restore
              </Button>
            )}
          </div>
        </div>
        <h1 className="font-display text-heading-lg text-text-primary">{goal.title}</h1>
        {goal.description && <p className="text-body-sm text-text-secondary">{goal.description}</p>}
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="neutral">{CATEGORY_LABELS[goal.category]}</Badge>
          <Badge variant="neutral">{TYPE_LABELS[goal.type]}</Badge>
          <Badge variant="neutral">{DIFFICULTY_LABELS[goal.difficulty]}</Badge>
          <Badge variant={STATUS_BADGE_VARIANT[goal.status]}>{STATUS_LABELS[goal.status]}</Badge>
        </div>
      </div>

      <section aria-labelledby="goal-progress-heading">
        <h3 id="goal-progress-heading" className="mb-2 text-body-sm font-semibold text-text-secondary">
          Progress
        </h3>
        <GoalProgressPanel progress={goal.progress} />
      </section>

      <section aria-labelledby="goal-milestones-heading">
        <h3 id="goal-milestones-heading" className="mb-2 text-body-sm font-semibold text-text-secondary">
          Milestones
        </h3>
        <GoalMilestoneList goalId={goal.id} milestones={goal.milestones} />
      </section>

      <section aria-labelledby="goal-evidence-heading">
        <h3 id="goal-evidence-heading" className="mb-2 text-body-sm font-semibold text-text-secondary">
          Evidence
        </h3>
        <GoalEvidenceList evidence={goal.progress?.evidence ?? []} />
      </section>

      <section aria-labelledby="goal-history-heading">
        <h3 id="goal-history-heading" className="mb-2 text-body-sm font-semibold text-text-secondary">
          History
        </h3>
        <GoalHistoryList history={history ?? []} />
      </section>
    </div>
  );
}
