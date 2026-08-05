'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ReflectionSortValue, ReflectionTimelineItemDto } from '@beaconvie/types';
import { reflectionApi } from '../api/reflection-api';
import { ReflectionCandidateCard } from './reflection-candidate-card';
import { BUCKET_LABELS } from '../labels';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Dropdown } from '@/components/ui/dropdown';

const SORT_OPTIONS = [
  { value: 'recency', label: 'Most recent' },
  { value: 'score', label: 'Highest score' },
  { value: 'category', label: 'Category' },
];

const BUCKET_ORDER = ['today', 'this_week', 'last_week', 'last_month', 'earlier'] as const;

export function ReflectionTimeline({ onSelect }: { onSelect: (id: string) => void }) {
  const [sort, setSort] = useState<ReflectionSortValue>('recency');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['reflections', 'timeline', sort],
    queryFn: () => reflectionApi.timeline({ sort }),
  });

  const grouped = groupByBucket(data?.items ?? []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Dropdown
          id="reflection-timeline-sort"
          label="Sort"
          value={sort}
          options={SORT_OPTIONS}
          onChange={(value) => setSort(value as ReflectionSortValue)}
          className="w-48"
        />
      </div>

      {isLoading && (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      )}
      {isError && <ErrorState description="Couldn't load your reflection timeline." onRetry={() => refetch()} />}
      {data && data.items.length === 0 && (
        <EmptyState title="No reflections yet" description="Patterns from your journal, memories, and goals will appear here over time." />
      )}
      {data &&
        data.items.length > 0 &&
        BUCKET_ORDER.filter((bucket) => grouped[bucket].length > 0).map((bucket) => (
          <section key={bucket} aria-labelledby={`reflection-bucket-${bucket}`}>
            <h3 id={`reflection-bucket-${bucket}`} className="mb-2 text-caption font-semibold uppercase tracking-wide text-text-disabled">
              {BUCKET_LABELS[bucket]}
            </h3>
            <ul className="flex flex-col gap-2">
              {grouped[bucket].map((item) => (
                <ReflectionCandidateCard key={item.id} candidate={item} onSelect={onSelect} />
              ))}
            </ul>
          </section>
        ))}
    </div>
  );
}

function groupByBucket(items: ReflectionTimelineItemDto[]): Record<(typeof BUCKET_ORDER)[number], ReflectionTimelineItemDto[]> {
  const result: Record<(typeof BUCKET_ORDER)[number], ReflectionTimelineItemDto[]> = {
    today: [],
    this_week: [],
    last_week: [],
    last_month: [],
    earlier: [],
  };
  for (const item of items) {
    result[item.bucket].push(item);
  }
  return result;
}
