'use client';

import { useQuery } from '@tanstack/react-query';
import { memoryApi } from '../api/memory-api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { ImportanceBadge } from './importance-badge';

/**
 * Read-only view of GET /memory/recommendations — the deterministic retrieval policy's top
 * memories. Never shows a raw importance score without ImportanceBadge's explanation
 * alongside it (Phase 10 requirement). Not wired into any live Companion conversation this
 * sprint — this is purely a transparency surface showing the user what the retrieval policy
 * would surface, so they can see (and trust) the decision layer itself. See
 * docs/architecture/memory-intelligence.md "Retrieval algorithm".
 */
export function RecommendationPanel() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['memory-recommendations'],
    queryFn: () => memoryApi.intelligence.recommendations({ limit: 10 }),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState description="Couldn't load your recommended memories." onRetry={() => refetch()} />;
  }

  const items = data?.items ?? [];

  if (items.length === 0) {
    return (
      <EmptyState
        title="Nothing to recommend yet."
        description="Once you have a few memories, the most relevant ones — based on importance, pins, and recency — will show up here."
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-caption text-text-tertiary">
        {data!.items.length} of {data!.candidateCount} memories shown, deterministically ranked — not AI-selected.
      </p>
      <ul className="flex flex-col gap-3" aria-label="Recommended memories">
        {items.map((item) => (
          <li key={item.id}>
            <Card className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <Badge variant="insight">{item.type.replace(/_/g, ' ').toLowerCase()}</Badge>
                <ImportanceBadge score={item.importanceScore} explanations={item.importanceExplanations} pinned={item.pinned} />
              </div>
              <p className="font-medium text-text-primary">{item.title}</p>
              <p className="text-body-sm text-text-secondary">{item.summary}</p>
              <p className="text-caption text-text-tertiary">{item.whyRecommended}</p>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
