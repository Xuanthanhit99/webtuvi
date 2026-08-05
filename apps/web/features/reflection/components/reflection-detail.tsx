'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reflectionApi } from '../api/reflection-api';
import { ReflectionScoreExplanation } from './reflection-score-explanation';
import { ReflectionSourceViewer } from './reflection-source-viewer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { toast } from '@/components/ui/toast';
import { CATEGORY_LABELS, STATE_LABELS, TRIGGER_LABELS } from '../labels';

export function ReflectionDetail({ id, onClose }: { id: string; onClose: () => void }) {
  const queryClient = useQueryClient();

  const { data: candidate, isLoading, isError, refetch } = useQuery({
    queryKey: ['reflections', id],
    queryFn: () => reflectionApi.get(id),
  });

  const archive = useMutation({
    mutationFn: () => reflectionApi.archive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reflections'] });
      toast.success('Archived.');
      onClose();
    },
    onError: () => toast.error("Couldn't archive that. Please try again."),
  });

  const dismiss = useMutation({
    mutationFn: () => reflectionApi.dismiss(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reflections'] });
      toast.success('Dismissed.');
      onClose();
    },
    onError: () => toast.error("Couldn't dismiss that. Please try again."),
  });

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }
  if (isError || !candidate) {
    return <ErrorState description="That reflection couldn't be found." onRetry={() => refetch()} />;
  }

  const isResolved = candidate.state === 'DISMISSED' || candidate.state === 'ARCHIVED' || candidate.state === 'EXPIRED';

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={onClose}>
          Back
        </Button>
        {!isResolved && (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => dismiss.mutate()} loading={dismiss.isPending}>
              Dismiss
            </Button>
            <Button size="sm" variant="secondary" onClick={() => archive.mutate()} loading={archive.isPending}>
              Archive
            </Button>
          </div>
        )}
      </div>

      {candidate.state === 'EXPIRED' && (
        <p className="rounded-md border border-caution/40 bg-caution/10 px-4 py-2 text-body-sm text-text-primary">
          One of the entries behind this reflection was deleted, so it&apos;s no longer valid.
        </p>
      )}
      {candidate.state === 'DISMISSED' && (
        <p className="rounded-md border border-border-subtle bg-surface-raised px-4 py-2 text-body-sm text-text-secondary">
          You dismissed this reflection.
        </p>
      )}
      {candidate.state === 'ARCHIVED' && (
        <p className="rounded-md border border-border-subtle bg-surface-raised px-4 py-2 text-body-sm text-text-secondary">
          You archived this reflection.
        </p>
      )}

      <div className="flex flex-col gap-2 rounded-md border border-border-subtle bg-surface p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="insight">{CATEGORY_LABELS[candidate.category]}</Badge>
          <Badge variant="neutral">{TRIGGER_LABELS[candidate.trigger]}</Badge>
          <Badge variant="neutral">{STATE_LABELS[candidate.state]}</Badge>
        </div>
        <p className="font-display text-heading-md text-text-primary">{candidate.reason}</p>
        <p className="text-caption text-text-disabled">
          Observed {new Date(candidate.windowStart).toLocaleDateString()} – {new Date(candidate.windowEnd).toLocaleDateString()}
        </p>
      </div>

      <section aria-labelledby="reflection-score-heading">
        <h3 id="reflection-score-heading" className="mb-2 text-body-sm font-semibold text-text-secondary">
          Why this score
        </h3>
        <ReflectionScoreExplanation score={candidate.score} explanation={candidate.scoreExplanation} />
      </section>

      <section aria-labelledby="reflection-sources-heading">
        <h3 id="reflection-sources-heading" className="mb-2 text-body-sm font-semibold text-text-secondary">
          Supporting evidence
        </h3>
        <ReflectionSourceViewer sources={candidate.sources} />
      </section>
    </div>
  );
}
