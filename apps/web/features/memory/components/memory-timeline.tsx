'use client';

import { useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import type { MemoryTimelineItemDto, MemoryTypeValue } from '@beaconvie/types';
import { memoryApi } from '../api/memory-api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dropdown } from '@/components/ui/dropdown';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { ImportanceBadge } from './importance-badge';

const TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'All types' },
  { value: 'IDENTITY', label: 'Identity' },
  { value: 'PREFERENCE', label: 'Preference' },
  { value: 'GOAL', label: 'Goal' },
  { value: 'RELATIONSHIP', label: 'Relationship' },
  { value: 'HABIT', label: 'Habit' },
  { value: 'ROUTINE', label: 'Routine' },
  { value: 'ACHIEVEMENT', label: 'Achievement' },
  { value: 'CHALLENGE', label: 'Challenge' },
  { value: 'EMOTION', label: 'Emotion' },
  { value: 'IMPORTANT_EVENT', label: 'Important event' },
  { value: 'DECISION', label: 'Decision' },
  { value: 'INTEREST', label: 'Interest' },
  { value: 'WORK', label: 'Work' },
  { value: 'STUDY', label: 'Study' },
  { value: 'PET', label: 'Pet' },
  { value: 'LOCATION_PREFERENCE', label: 'Place preference' },
  { value: 'HEALTH', label: 'Health' },
  { value: 'CUSTOM', label: 'Other' },
];

const GROUP_LABELS: Record<MemoryTimelineItemDto['group'], string> = {
  today: 'Today',
  this_week: 'This week',
  earlier: 'Earlier',
};

export interface MemoryTimelineProps {
  onSelect: (id: string) => void;
}

export function MemoryTimeline({ onSelect }: MemoryTimelineProps) {
  const [type, setType] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  const filters = { type: (type || undefined) as MemoryTypeValue | undefined, status: showArchived ? 'ARCHIVED' : undefined };

  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } = useInfiniteQuery({
    queryKey: ['memory-timeline', filters],
    queryFn: ({ pageParam }: { pageParam?: string }) => memoryApi.timeline({ ...filters, cursor: pageParam, limit: 20 }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  const items = data?.pages.flatMap((page) => page.items) ?? [];

  let lastGroup: string | null = null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <Dropdown id="memory-type-filter" label="Filter by type" value={type} options={TYPE_OPTIONS} onChange={setType} className="w-56" />
        <Button
          type="button"
          variant={showArchived ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setShowArchived((v) => !v)}
        >
          {showArchived ? 'Showing archived' : 'Show archived'}
        </Button>
      </div>

      {isLoading && (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      )}

      {isError && <ErrorState description="Couldn't load your memory timeline." onRetry={() => refetch()} />}

      {!isLoading && !isError && items.length === 0 && (
        <EmptyState
          title={showArchived ? 'No archived memories.' : 'No memories yet.'}
          description={
            showArchived
              ? undefined
              : 'When you ask BeaconVie to remember something from a conversation, it will show up here — with the source, the reason, and your consent choice always visible.'
          }
        />
      )}

      <ol className="flex flex-col gap-5" aria-label="Memory timeline">
        {items.map((item) => {
          const showGroupHeader = item.group !== lastGroup;
          lastGroup = item.group;
          return (
            <li key={item.id}>
              {showGroupHeader && (
                <h2 className="mb-2 text-body-sm font-semibold uppercase tracking-wide text-text-secondary">
                  {GROUP_LABELS[item.group]}
                </h2>
              )}
              <Card
                className="cursor-pointer"
                role="button"
                tabIndex={0}
                onClick={() => onSelect(item.id)}
                onKeyDown={(e) => e.key === 'Enter' && onSelect(item.id)}
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="insight">{item.type.replace(/_/g, ' ').toLowerCase()}</Badge>
                    <ImportanceBadge score={item.importanceScore} explanations={item.importanceExplanations} pinned={item.pinned} />
                  </div>
                  <time className="text-caption text-text-tertiary" dateTime={item.createdAt}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </time>
                </div>
                <p className="font-medium text-text-primary">{item.title}</p>
                <p className="mt-1 line-clamp-2 text-body-sm text-text-secondary">{item.summary}</p>
                <p className="mt-2 text-caption text-text-tertiary">
                  {item.whyThisMemory} {item.sourceAvailable ? '' : '(source no longer available)'}
                </p>
              </Card>
            </li>
          );
        })}
      </ol>

      {hasNextPage && (
        <Button variant="secondary" onClick={() => fetchNextPage()} loading={isFetchingNextPage}>
          Load more
        </Button>
      )}
    </div>
  );
}
