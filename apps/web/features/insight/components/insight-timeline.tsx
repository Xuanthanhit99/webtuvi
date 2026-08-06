'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { InsightTimelineGroupByValue, InsightTimelineRangeValue } from '@beaconvie/types';
import { insightApi } from '../api/insight-api';
import { InsightCard } from './insight-card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Dropdown } from '@/components/ui/dropdown';

const RANGE_OPTIONS: { value: InsightTimelineRangeValue; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'Last 7 days' },
  { value: 'month', label: 'Last 30 days' },
];

const GROUP_BY_OPTIONS: { value: InsightTimelineGroupByValue; label: string }[] = [
  { value: 'category', label: 'Category' },
  { value: 'priority', label: 'Priority' },
  { value: 'topic', label: 'Topic' },
];

/** Phase 4 — Today / 7 days / 30 days, grouped by category / priority / topic. Custom range is
 * reachable via the same `from`/`to` query params the API accepts; this control surfaces the three
 * fixed presets plus a date-range pair, mirroring `ReflectionTimeline`'s own sort-dropdown pattern. */
export function InsightTimeline({ onSelect }: { onSelect: (id: string) => void }) {
  const [range, setRange] = useState<InsightTimelineRangeValue>('week');
  const [groupBy, setGroupBy] = useState<InsightTimelineGroupByValue>('category');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const isCustom = range === 'custom';

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['insight-candidates', 'timeline', range, groupBy, customFrom, customTo],
    queryFn: () => insightApi.timeline({ range, groupBy, from: isCustom ? customFrom : undefined, to: isCustom ? customTo : undefined }),
    enabled: !isCustom || (customFrom !== '' && customTo !== ''),
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-end gap-3">
        {isCustom && (
          <>
            <label className="flex flex-col gap-1 text-body-sm text-text-secondary">
              From
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="h-11 rounded-md border border-border-subtle bg-surface px-3 text-body-md text-text-primary"
              />
            </label>
            <label className="flex flex-col gap-1 text-body-sm text-text-secondary">
              To
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="h-11 rounded-md border border-border-subtle bg-surface px-3 text-body-md text-text-primary"
              />
            </label>
          </>
        )}
        <Dropdown
          id="insight-timeline-range"
          label="Range"
          value={range}
          options={[...RANGE_OPTIONS, { value: 'custom', label: 'Custom range' }]}
          onChange={(value) => setRange(value as InsightTimelineRangeValue)}
          className="w-44"
        />
        <Dropdown
          id="insight-timeline-group-by"
          label="Group by"
          value={groupBy}
          options={GROUP_BY_OPTIONS}
          onChange={(value) => setGroupBy(value as InsightTimelineGroupByValue)}
          className="w-40"
        />
      </div>

      {isLoading && (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      )}
      {isError && <ErrorState description="Couldn't load the insight timeline." onRetry={() => refetch()} />}
      {data && data.groups.length === 0 && (
        <EmptyState title="Nothing in this range" description="No insights were created in the selected time window." />
      )}
      {data &&
        data.groups.map((group) => (
          <section key={group.key} aria-labelledby={`insight-timeline-group-${group.key}`}>
            <h3
              id={`insight-timeline-group-${group.key}`}
              className="mb-2 text-caption font-semibold uppercase tracking-wide text-text-disabled"
            >
              {group.label} ({group.items.length})
            </h3>
            <ul className="flex flex-col gap-2">
              {group.items.map((item) => (
                <InsightCard key={item.id} card={item} onSelect={onSelect} />
              ))}
            </ul>
          </section>
        ))}
    </div>
  );
}
