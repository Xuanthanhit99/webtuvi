'use client';

import { useState } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import type { JournalMoodValue, JournalTimelineItemDto } from '@beaconvie/types';
import { journalApi, type JournalFilters } from '../api/journal-api';
import { JournalEntryCard } from './journal-entry-card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dropdown } from '@/components/ui/dropdown';

const MOOD_OPTIONS = [
  { value: '', label: 'Any mood' },
  { value: 'GREAT', label: 'Great' },
  { value: 'GOOD', label: 'Good' },
  { value: 'OKAY', label: 'Okay' },
  { value: 'LOW', label: 'Low' },
  { value: 'DIFFICULT', label: 'Difficult' },
];

export function JournalTimeline({ onSelect }: { onSelect: (id: string) => void }) {
  const [q, setQ] = useState('');
  const [mood, setMood] = useState('');
  const [tag, setTag] = useState('');

  const filters: JournalFilters = { q: q || undefined, mood: (mood || undefined) as JournalMoodValue | undefined, tag: tag || undefined };
  const isFiltering = Boolean(q || mood || tag);

  const pinned = useQuery({
    queryKey: ['journal', 'pinned'],
    queryFn: () => journalApi.list({ pinned: true, pageSize: 5 }),
    enabled: !isFiltering,
  });

  const searchResults = useQuery({
    queryKey: ['journal', 'search', filters],
    queryFn: () => journalApi.list(filters),
    enabled: isFiltering,
  });

  const timeline = useInfiniteQuery({
    queryKey: ['journal', 'timeline'],
    queryFn: ({ pageParam }: { pageParam?: string }) => journalApi.timeline({ groupBy: 'day', cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !isFiltering,
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-2">
        <label htmlFor="journal-search" className="sr-only">
          Search your journal
        </label>
        <Input id="journal-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title and content…" className="flex-1 min-w-[200px]" />
        <Dropdown id="journal-mood-filter" label="Mood" value={mood} options={MOOD_OPTIONS} onChange={setMood} className="w-40" />
        <label htmlFor="journal-tag-filter" className="sr-only">
          Filter by tag
        </label>
        <Input id="journal-tag-filter" value={tag} onChange={(e) => setTag(e.target.value)} placeholder="Filter by tag…" className="w-40" />
      </div>

      {isFiltering ? (
        <section aria-labelledby="journal-search-results">
          <h2 id="journal-search-results" className="mb-3 text-body-sm font-semibold text-text-secondary">
            {searchResults.isLoading ? 'Searching…' : `${searchResults.data?.total ?? 0} result${searchResults.data?.total === 1 ? '' : 's'}`}
          </h2>
          {searchResults.isLoading && (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          )}
          {searchResults.data && searchResults.data.items.length === 0 && (
            <p className="text-body-sm text-text-secondary">Nothing matches that search.</p>
          )}
          {searchResults.data && searchResults.data.items.length > 0 && (
            <ul className="flex flex-col gap-2">
              {searchResults.data.items.map((entry) => (
                <JournalEntryCard key={entry.id} entry={entry} onSelect={onSelect} />
              ))}
            </ul>
          )}
        </section>
      ) : (
        <>
          {pinned.data && pinned.data.items.length > 0 && (
            <section aria-labelledby="journal-pinned">
              <h2 id="journal-pinned" className="mb-3 text-body-sm font-semibold text-text-secondary">
                Pinned
              </h2>
              <ul className="flex flex-col gap-2">
                {pinned.data.items.map((entry) => (
                  <JournalEntryCard key={entry.id} entry={entry} onSelect={onSelect} />
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="journal-timeline-heading">
            <h2 id="journal-timeline-heading" className="mb-3 text-body-sm font-semibold text-text-secondary">
              Timeline
            </h2>
            {timeline.isLoading && (
              <div className="flex flex-col gap-2">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            )}
            {timeline.data && timeline.data.pages[0]!.items.length === 0 && (
              <EmptyState title="Nothing here yet" description="Write your first entry whenever you're ready." />
            )}
            {timeline.data && groupPages(timeline.data.pages).map((group) => (
              <div key={group.groupKey} className="mb-6">
                <h3 className="mb-2 text-caption font-semibold uppercase tracking-wide text-text-disabled">{group.groupLabel}</h3>
                <ul className="flex flex-col gap-2">
                  {group.items.map((entry) => (
                    <JournalEntryCard key={entry.id} entry={entry} onSelect={onSelect} />
                  ))}
                </ul>
              </div>
            ))}
            {timeline.hasNextPage && (
              <Button variant="secondary" onClick={() => timeline.fetchNextPage()} loading={timeline.isFetchingNextPage}>
                Load more
              </Button>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function groupPages(pages: { items: JournalTimelineItemDto[] }[]): { groupKey: string; groupLabel: string; items: JournalTimelineItemDto[] }[] {
  const groups = new Map<string, { groupKey: string; groupLabel: string; items: JournalTimelineItemDto[] }>();
  for (const page of pages) {
    for (const item of page.items) {
      const existing = groups.get(item.groupKey);
      if (existing) {
        existing.items.push(item);
      } else {
        groups.set(item.groupKey, { groupKey: item.groupKey, groupLabel: item.groupLabel, items: [item] });
      }
    }
  }
  return [...groups.values()];
}
