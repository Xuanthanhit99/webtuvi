'use client';

import { useQuery } from '@tanstack/react-query';
import { memoryApi } from '../api/memory-api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';

const STATUS_LABELS: Record<string, string> = {
  CONFLICT: 'Contradiction',
  SUPERSEDED: 'Likely replaced',
};

/**
 * Read-only view of GET /memory/conflicts — deterministic contradiction detection. Nothing
 * here is ever auto-resolved or auto-overwritten; both memories in a conflict remain exactly
 * as they were until the user takes their own action elsewhere (e.g. archiving one from the
 * timeline). See docs/architecture/memory-intelligence.md "Conflict policy".
 */
export function ConflictsSection() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['memory-conflicts'],
    queryFn: () => memoryApi.intelligence.conflicts(),
  });

  if (isLoading) return <Skeleton className="h-20 w-full" />;
  if (isError) return <ErrorState description="Couldn't check for conflicting memories." onRetry={() => refetch()} />;

  const conflicts = data ?? [];
  if (conflicts.length === 0) {
    return <EmptyState title="No conflicts found." description="Mệnh Vi flags memories that seem to contradict each other, like an old address next to a new one." />;
  }

  return (
    <ul className="flex flex-col gap-3" aria-label="Conflicting memories">
      {conflicts.map((conflict) => (
        <li key={conflict.id}>
          <Card className="flex flex-col gap-1">
            <Badge variant={conflict.status === 'SUPERSEDED' ? 'new' : 'neutral'}>
              {STATUS_LABELS[conflict.status] ?? conflict.status}
            </Badge>
            <p className="text-body-sm text-text-secondary">{conflict.reason}</p>
          </Card>
        </li>
      ))}
    </ul>
  );
}
