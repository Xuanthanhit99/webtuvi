'use client';

import { useQuery } from '@tanstack/react-query';
import { reflectionApi } from '../api/reflection-api';
import { ReflectionCandidateCard } from './reflection-candidate-card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';

/** Phase 7 — Reflection Candidate, reason, supporting evidence, score. Never AI wording, never a
 * claim of understanding emotions — every string here is either the rule's own deterministic
 * `reason` or plain structural metadata (score, source count, dates). */
export function ReflectionFeed({ onSelect }: { onSelect: (id: string) => void }) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['reflections', 'feed'],
    queryFn: () => reflectionApi.feed(),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }
  if (isError) {
    return <ErrorState description="Couldn't load your reflections." onRetry={() => refetch()} />;
  }
  if (!data || data.length === 0) {
    return (
      <EmptyState
        title="Nothing to reflect on yet"
        description="As you write in your journal, save memories, and work toward goals, patterns worth reflecting on will show up here."
      />
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {data.map((candidate) => (
        <ReflectionCandidateCard key={candidate.id} candidate={candidate} onSelect={onSelect} />
      ))}
    </ul>
  );
}
