'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
import { goalApi } from '../api/goal-api';
import { GoalCard } from './goal-card';
import { GoalDetail } from './goal-detail';
import { GoalFilterBar, type GoalListFilters } from './goal-filter-bar';
import { GoalCreateDialog } from './goal-create-dialog';

/**
 * `/goals` — list + `?item=<id>` "open detail in place" pattern every other module in this
 * product already uses (Memory/Insight/Review). No week/month-style quick-entry cards — a Goal has
 * no calendar-window analog, unlike Review.
 */
export function GoalDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeId = searchParams.get('item');
  const [filters, setFilters] = useState<GoalListFilters>({});
  const [createOpen, setCreateOpen] = useState(false);

  function selectItem(id: string | null) {
    router.replace(id ? `/goals?item=${id}` : '/goals', { scroll: false });
  }

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['goals', 'list', filters],
    queryFn: () => goalApi.list(filters),
    enabled: !activeId,
  });

  if (activeId) {
    return <GoalDetail id={activeId} onClose={() => selectItem(null)} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-heading-lg text-text-primary">Goals</h1>
          <p className="mt-2 text-body-sm text-text-secondary">
            Deterministic learning and life goals. Progress is computed from your own real journal entries, memories,
            reflections, insights, and reviews — never AI-generated.
          </p>
        </div>
        <Button variant="primary" onClick={() => setCreateOpen(true)}>
          Create goal
        </Button>
      </div>

      <GoalFilterBar filters={filters} onChange={setFilters} />

      {isLoading && <Skeleton className="h-64 w-full" />}
      {isError && <ErrorState description="Couldn't load your goals." onRetry={() => refetch()} />}
      {data && data.items.length === 0 && (
        <EmptyState title="No goals yet" description="Create your first goal to start tracking real, deterministic progress." />
      )}
      {data && data.items.length > 0 && (
        <div className="grid grid-cols-1 gap-3 tablet:grid-cols-2">
          {data.items.map((goal) => (
            <GoalCard key={goal.id} goal={goal} onSelect={selectItem} />
          ))}
        </div>
      )}

      <GoalCreateDialog open={createOpen} onClose={() => setCreateOpen(false)} onCreated={(id) => { setCreateOpen(false); selectItem(id); }} />
    </div>
  );
}
