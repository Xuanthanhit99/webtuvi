'use client';

import { useQuery } from '@tanstack/react-query';
import { reflectionApi } from '../api/reflection-api';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { CATEGORY_LABELS } from '../labels';

/** Phase 4 — deterministic grouping only (by goal/topic/time window/journal/memory/category via
 * the already-computed `groupKey`). No semantic clustering. */
export function ReflectionGroups({ onSelect }: { onSelect: (id: string) => void }) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['reflections', 'groups'],
    queryFn: () => reflectionApi.groups(),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }
  if (isError) {
    return <ErrorState description="Couldn't load reflection groups." onRetry={() => refetch()} />;
  }
  if (!data || data.length === 0) {
    return <EmptyState title="No groups yet" description="Once related reflections build up, they'll be grouped here." />;
  }

  return (
    <ul className="flex flex-col gap-2">
      {data.map((group) => (
        <li key={group.groupKey}>
          <button
            type="button"
            onClick={() => onSelect(group.latest.id)}
            className="flex w-full flex-col gap-1.5 rounded-md border border-border-subtle bg-surface p-4 text-left transition-colors duration-fast hover:bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-insight"
          >
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="insight">{CATEGORY_LABELS[group.category]}</Badge>
              <Badge variant="neutral">
                {group.count} item{group.count === 1 ? '' : 's'}
              </Badge>
              <Badge variant="neutral">Avg score {group.averageScore}</Badge>
            </div>
            <p className="text-body-md text-text-primary">{group.latest.reason}</p>
          </button>
        </li>
      ))}
    </ul>
  );
}
