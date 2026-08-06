'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { InsightCardDto } from '@beaconvie/types';
import { insightApi, type InsightCardFilters } from '../api/insight-api';
import { InsightCard } from './insight-card';
import { InsightFilterBar } from './insight-filter-bar';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';

const PAGE_SIZE = 20;

/**
 * Shared list surface for the dashboard's Top/Recent/Pinned/Archived sections (Phase 5) — a fixed
 * `baseFilters` (e.g. `{ sort: 'priority' }` for Top, `{ pinned: true }` for Pinned) plus the
 * user-adjustable Phase 6 filter bar (category/priority/date/status/source), merged into one
 * `GET /insight-candidates/cards` query. Empty state (Phase 5) renders per-section copy.
 */
export function InsightCardList({
  baseFilters,
  showStatus,
  emptyTitle,
  emptyDescription,
  onSelect,
}: {
  baseFilters: InsightCardFilters;
  showStatus: boolean;
  emptyTitle: string;
  emptyDescription: string;
  onSelect: (id: string) => void;
}) {
  const [filters, setFilters] = useState<InsightCardFilters>({});
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<InsightCardDto[]>([]);
  const queryClient = useQueryClient();

  const merged: InsightCardFilters = { ...baseFilters, ...filters, page, pageSize: PAGE_SIZE };

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['insight-candidates', 'cards', merged],
    queryFn: () => insightApi.cards(merged),
  });

  useEffect(() => {
    setPage(1);
    setItems([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(baseFilters), JSON.stringify(filters)]);

  useEffect(() => {
    if (!data) return;
    setItems((prev) => (page === 1 ? data.items : [...prev, ...data.items]));
  }, [data, page]);

  const togglePin = useMutation({
    mutationFn: (card: InsightCardDto) => (card.pinned ? insightApi.unpin(card.id) : insightApi.pin(card.id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['insight-candidates'] }),
    onError: () => toast.error("Couldn't update pin. Please try again."),
  });

  const hasMore = data ? page * PAGE_SIZE < data.total : false;

  return (
    <div className="flex flex-col gap-4">
      <InsightFilterBar idPrefix="insight-cards" filters={filters} onChange={setFilters} showStatus={showStatus} />

      {isLoading && page === 1 && (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      )}
      {isError && <ErrorState description="Couldn't load insights." onRetry={() => refetch()} />}
      {data && items.length === 0 && <EmptyState title={emptyTitle} description={emptyDescription} />}
      {items.length > 0 && (
        <ul className="flex flex-col gap-2">
          {items.map((card) => (
            <InsightCard key={card.id} card={card} onSelect={onSelect} onTogglePin={(c) => togglePin.mutate(c)} pinPending={togglePin.isPending} />
          ))}
        </ul>
      )}
      {hasMore && (
        <Button variant="secondary" size="sm" onClick={() => setPage((p) => p + 1)} loading={isLoading && page > 1} className="self-center">
          Load more
        </Button>
      )}
    </div>
  );
}
