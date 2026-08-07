'use client';

import { useState } from 'react';
import type { ReviewSummaryDto } from '@beaconvie/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { reviewApi, type ReviewDetailFilters } from '../api/review-api';
import { ReviewStatisticsPanel } from './review-statistics-panel';
import { ReviewSectionList } from './review-section-list';
import { ReviewFilterBar } from './review-filter-bar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { toast } from '@/components/ui/toast';
import { STATE_BADGE_VARIANT, STATE_LABELS, WINDOW_LABELS } from '../labels';

function downloadMarkdown(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Phase 2/3/4/6/7 — the review body shared by both `/reviews/:window` (current period) and
 * `/reviews/:id` (a specific, possibly-archived review): Overview, Statistics, filtered Sections/
 * Evidence, and Export/Archive actions. `initialReview` lets a caller that already has the object
 * in memory (e.g. just navigated from a list) skip the first fetch; `queryKey` still drives re-
 * fetches when filters change.
 */
export function ReviewContent({
  queryKey,
  fetcher,
  onArchived,
}: {
  queryKey: unknown[];
  fetcher: (filters: ReviewDetailFilters) => Promise<ReviewSummaryDto>;
  onArchived?: () => void;
}) {
  const [filters, setFilters] = useState<ReviewDetailFilters>({});
  const queryClient = useQueryClient();

  const { data: review, isLoading, isError, refetch } = useQuery({
    queryKey: [...queryKey, filters],
    queryFn: () => fetcher(filters),
  });

  const archive = useMutation({
    mutationFn: (id: string) => reviewApi.archive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      toast.success('Review archived.');
      onArchived?.();
    },
    onError: () => toast.error("Couldn't archive that. Please try again."),
  });

  const exportMarkdown = useMutation({
    mutationFn: (id: string) => reviewApi.exportMarkdown(id),
    onSuccess: (result) => downloadMarkdown(result.filename, result.content),
    onError: () => toast.error("Couldn't export that. Please try again."),
  });

  const exportJson = useMutation({
    mutationFn: (id: string) => reviewApi.exportJson(id),
    onSuccess: (result) => downloadJson(`${result.window.toLowerCase()}-review-${result.windowStart.slice(0, 10)}.json`, result),
    onError: () => toast.error("Couldn't export that. Please try again."),
  });

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (isError || !review) return <ErrorState description="Couldn't load that review." onRetry={() => refetch()} />;

  const isArchived = review.state === 'ARCHIVED';

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 rounded-md border border-border-subtle bg-surface p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="insight">{WINDOW_LABELS[review.window]}</Badge>
            <Badge variant={STATE_BADGE_VARIANT[review.state]}>{STATE_LABELS[review.state]}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => exportMarkdown.mutate(review.id)} loading={exportMarkdown.isPending}>
              Export Markdown
            </Button>
            <Button variant="ghost" size="sm" onClick={() => exportJson.mutate(review.id)} loading={exportJson.isPending}>
              Export JSON
            </Button>
            {!isArchived && (
              <Button variant="secondary" size="sm" onClick={() => archive.mutate(review.id)} loading={archive.isPending}>
                Archive
              </Button>
            )}
          </div>
        </div>
        <p className="font-display text-heading-md text-text-primary">{review.overview}</p>
        <p className="text-caption text-text-disabled">
          {new Date(review.windowStart).toLocaleDateString()} – {new Date(review.windowEnd).toLocaleDateString()}
        </p>
      </div>

      <section aria-labelledby="review-statistics-heading">
        <h3 id="review-statistics-heading" className="mb-2 text-body-sm font-semibold text-text-secondary">
          Statistics
        </h3>
        <ReviewStatisticsPanel statistics={review.statistics} />
      </section>

      <section aria-labelledby="review-sections-heading">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
          <h3 id="review-sections-heading" className="text-body-sm font-semibold text-text-secondary">
            Sections
          </h3>
          <ReviewFilterBar filters={filters} onChange={setFilters} />
        </div>
        <ReviewSectionList sections={review.sections} />
      </section>
    </div>
  );
}
