'use client';

import { useQuery } from '@tanstack/react-query';
import { memoryApi } from '../api/memory-api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';

const MATCH_TYPE_LABELS: Record<string, string> = {
  EXACT: 'Identical text',
  NORMALIZED: 'Same wording',
  STRUCTURED: 'Same detail',
  TYPE_SPECIFIC: 'Very similar',
};

/**
 * Read-only view of GET /memory/duplicates — deterministic text/structure matching, never
 * embeddings. A duplicate pair shown here is not merged or altered by simply viewing it; see
 * MergeSuggestionsPanel for the only user-facing action that follows from a duplicate finding.
 */
export function DuplicatesSection() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['memory-duplicates'],
    queryFn: () => memoryApi.intelligence.duplicates(),
  });

  if (isLoading) return <Skeleton className="h-20 w-full" />;
  if (isError) return <ErrorState description="Couldn't check for duplicate memories." onRetry={() => refetch()} />;

  const duplicates = data ?? [];
  if (duplicates.length === 0) {
    return <EmptyState title="No duplicates found." description="BeaconVie checks for repeated or near-identical memories automatically." />;
  }

  return (
    <ul className="flex flex-col gap-3" aria-label="Duplicate memories">
      {duplicates.map((dup) => (
        <li key={dup.id}>
          <Card className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Badge variant="neutral">{MATCH_TYPE_LABELS[dup.matchType] ?? dup.matchType}</Badge>
              <span className="text-caption text-text-tertiary">{dup.similarity}% match</span>
            </div>
            <p className="text-body-sm text-text-secondary">{dup.reason}</p>
          </Card>
        </li>
      ))}
    </ul>
  );
}
