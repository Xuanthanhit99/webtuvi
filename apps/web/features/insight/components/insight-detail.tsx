'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { insightApi } from '../api/insight-api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { toast } from '@/components/ui/toast';
import { CATEGORY_LABELS, RELATIONSHIP_LABELS, STATUS_LABELS } from '../labels';

export function InsightDetail({ id, onClose }: { id: string; onClose: () => void }) {
  const queryClient = useQueryClient();

  const { data: candidate, isLoading, isError, refetch } = useQuery({
    queryKey: ['insight-candidates', id],
    queryFn: () => insightApi.get(id),
  });

  const archive = useMutation({
    mutationFn: () => insightApi.archive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insight-candidates'] });
      toast.success('Archived.');
      onClose();
    },
    onError: () => toast.error("Couldn't archive that. Please try again."),
  });

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }
  if (isError || !candidate) {
    return <ErrorState description="That insight candidate couldn't be found." onRetry={() => refetch()} />;
  }

  const isResolved = candidate.status === 'ARCHIVED';

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={onClose}>
          Back
        </Button>
        {!isResolved && (
          <Button size="sm" variant="secondary" onClick={() => archive.mutate()} loading={archive.isPending}>
            Archive
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-2 rounded-md border border-border-subtle bg-surface p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="insight">{CATEGORY_LABELS[candidate.category]}</Badge>
          <Badge variant={candidate.status === 'READY' ? 'new' : 'neutral'}>{STATUS_LABELS[candidate.status]}</Badge>
        </div>
        <p className="font-display text-heading-md text-text-primary">{candidate.ruleExplanation}</p>
        <p className="text-caption text-text-disabled">
          Timeline: {new Date(candidate.windowStart).toLocaleDateString()} – {new Date(candidate.windowEnd).toLocaleDateString()}
        </p>
      </div>

      <section aria-labelledby="insight-priority-heading">
        <h3 id="insight-priority-heading" className="mb-2 text-body-sm font-semibold text-text-secondary">
          Priority
        </h3>
        <div className="flex flex-col gap-2 rounded-md border border-border-subtle bg-surface p-3">
          <div className="flex items-center gap-2">
            <span className="font-display text-heading-sm text-text-primary">{candidate.priority}</span>
            <span className="text-caption text-text-disabled">/ 100</span>
          </div>
          {candidate.priorityExplanation.length === 0 ? (
            <p className="text-body-sm text-text-secondary">No priority factors applied.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {candidate.priorityExplanation.map((line) => (
                <li key={line} className="text-body-sm text-text-secondary">
                  {line}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section aria-labelledby="insight-evidence-heading">
        <h3 id="insight-evidence-heading" className="mb-2 text-body-sm font-semibold text-text-secondary">
          Evidence ({candidate.evidence.length})
        </h3>
        <ul className="flex flex-col gap-2">
          {candidate.evidence.map((e) => (
            <li key={e.reflectionCandidateId} className="rounded-md border border-border-subtle bg-surface px-3 py-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="neutral">{e.reflectionCategory}</Badge>
                <Badge variant="neutral">Score {e.reflectionScore}</Badge>
                {e.reflectionState !== 'READY' && <Badge variant="neutral">{e.reflectionState}</Badge>}
              </div>
              <p className="mt-1 text-body-sm text-text-primary">{e.contribution}</p>
            </li>
          ))}
        </ul>
      </section>

      {candidate.relationships.length > 0 && (
        <section aria-labelledby="insight-relationships-heading">
          <h3 id="insight-relationships-heading" className="mb-2 text-body-sm font-semibold text-text-secondary">
            Relationships ({candidate.relationships.length})
          </h3>
          <ul className="flex flex-col gap-2">
            {candidate.relationships.map((r) => (
              <li key={r.id} className="rounded-md border border-border-subtle bg-surface px-3 py-2">
                <Badge variant="neutral">{RELATIONSHIP_LABELS[r.type]}</Badge>
                <p className="mt-1 text-body-sm text-text-primary">{r.reason}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
