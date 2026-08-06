'use client';

import { Pin } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { insightApi } from '../api/insight-api';
import { InsightEvidenceView } from './insight-evidence-view';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { toast } from '@/components/ui/toast';
import { PRIORITY_BADGE_VARIANT, STATUS_BADGE_VARIANT } from '../labels';

/**
 * The Insight Experience's detail view: what happened (`reason.headline`), why it matters
 * (`reason.whyItMatters`), and the Evidence View (Phase 3) beneath it — the same "open detail in
 * place" pattern `MemoryView`/`JournalHome`/`ReflectionHome`/the internal Insight view already use.
 * Fetches by id (`GET /insight-candidates/:id/card`) rather than requiring the caller to already
 * hold the card in memory, so a direct link or page refresh with `?item=id` in the URL still works.
 */
export function InsightCardDetail({ id, onClose }: { id: string; onClose: () => void }) {
  const queryClient = useQueryClient();

  const { data: card, isLoading, isError, refetch } = useQuery({
    queryKey: ['insight-candidates', id, 'card'],
    queryFn: () => insightApi.card(id),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['insight-candidates'] });
  };

  const archive = useMutation({
    mutationFn: () => insightApi.archive(id),
    onSuccess: () => {
      invalidate();
      toast.success('Archived.');
      onClose();
    },
    onError: () => toast.error("Couldn't archive that. Please try again."),
  });

  const togglePin = useMutation({
    mutationFn: () => (card?.pinned ? insightApi.unpin(id) : insightApi.pin(id)),
    onSuccess: () => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ['insight-candidates', id, 'card'] });
    },
    onError: () => toast.error("Couldn't update pin. Please try again."),
  });

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (isError || !card) return <ErrorState description="That insight couldn't be found." onRetry={() => refetch()} />;

  const isArchived = card.status.value === 'ARCHIVED';

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={onClose}>
          Back
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => togglePin.mutate()} loading={togglePin.isPending}>
            <Pin className={`mr-1.5 h-4 w-4 ${card.pinned ? 'fill-insight text-insight' : ''}`} aria-hidden="true" />
            {card.pinned ? 'Unpin' : 'Pin'}
          </Button>
          {!isArchived && (
            <Button variant="secondary" size="sm" onClick={() => archive.mutate()} loading={archive.isPending}>
              Archive
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2 rounded-md border border-border-subtle bg-surface p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="insight">{card.category.label}</Badge>
          <Badge variant={STATUS_BADGE_VARIANT[card.status.value]}>{card.status.label}</Badge>
          <Badge variant={PRIORITY_BADGE_VARIANT[card.priorityBadge.tier]}>{card.priorityBadge.label}</Badge>
        </div>
        <p className="font-display text-heading-md text-text-primary">{card.reason.headline}</p>
        <p className="text-body-sm text-text-secondary">{card.reason.evidenceSummary}</p>
        <p className="text-caption text-text-disabled">
          Timeline: {new Date(card.windowStart).toLocaleDateString()} – {new Date(card.windowEnd).toLocaleDateString()}
        </p>
      </div>

      <section aria-labelledby="insight-why-heading">
        <h3 id="insight-why-heading" className="mb-2 text-body-sm font-semibold text-text-secondary">
          Why it matters
        </h3>
        <div className="flex flex-col gap-2 rounded-md border border-border-subtle bg-surface p-3">
          <div className="flex items-center gap-2">
            <span className="font-display text-heading-sm text-text-primary">{card.priorityBadge.priority}</span>
            <span className="text-caption text-text-disabled">/ 100</span>
          </div>
          {card.reason.whyItMatters.length === 0 ? (
            <p className="text-body-sm text-text-secondary">No priority factors applied.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {card.reason.whyItMatters.map((line) => (
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
          Evidence ({card.evidenceCount})
        </h3>
        <InsightEvidenceView insightId={id} />
      </section>
    </div>
  );
}
