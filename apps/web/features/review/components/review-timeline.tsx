'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reviewApi, type ListReviewsFilters } from '../api/review-api';
import { ReviewCard } from './review-card';
import { ReviewListFilterBar } from './review-list-filter-bar';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Button } from '@/components/ui/button';

const PAGE_SIZE = 20;

/** Phase 4 — Review Timeline: past reviews in reverse-chronological order (by `windowStart`),
 * with Phase 6's date/window/status filters. */
export function ReviewTimeline({ onSelect }: { onSelect: (id: string) => void }) {
  const [filters, setFilters] = useState<ListReviewsFilters>({});
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['reviews', 'timeline', filters, page],
    queryFn: () => reviewApi.list({ ...filters, page, pageSize: PAGE_SIZE }),
  });

  function updateFilters(next: ListReviewsFilters) {
    setFilters(next);
    setPage(1);
  }

  return (
    <div className="flex flex-col gap-4">
      <ReviewListFilterBar filters={filters} onChange={updateFilters} />

      {isLoading && (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      )}
      {isError && <ErrorState description="Couldn't load your review timeline." onRetry={() => refetch()} />}
      {data && data.items.length === 0 && (
        <EmptyState title="No reviews yet" description="Weekly and monthly reviews will appear here once generated." />
      )}
      {data && data.items.length > 0 && (
        <ul className="flex flex-col gap-2">
          {data.items.map((review) => (
            <ReviewCard key={review.id} review={review} onSelect={onSelect} />
          ))}
        </ul>
      )}
      {data && page * PAGE_SIZE < data.total && (
        <Button variant="secondary" size="sm" onClick={() => setPage((p) => p + 1)} className="self-center">
          Load more
        </Button>
      )}
    </div>
  );
}
