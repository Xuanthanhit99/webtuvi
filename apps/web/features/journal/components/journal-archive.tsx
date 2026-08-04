'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { journalApi } from '../api/journal-api';
import { JournalEntryCard } from './journal-entry-card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';

type Tab = 'archived' | 'deleted';

/** `/journal/archive` — Phase 4's "Archived entries" timeline section, plus "Recently deleted"
 * (the owner-only view a soft-deleted entry is still reachable from — see
 * docs/architecture/journal-foundation.md "Lifecycle"). Both tabs reuse the same list endpoint
 * with a `state` filter, never a separate read path. */
export function JournalArchive() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('archived');

  const { data, isLoading } = useQuery({
    queryKey: ['journal', 'list', tab],
    queryFn: () => journalApi.list({ state: tab === 'archived' ? 'ARCHIVED' : 'DELETED', pageSize: 50 }),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-heading-lg text-text-primary">Journal archive</h1>
        <Button variant="ghost" size="sm" onClick={() => router.push('/journal')}>
          Back to Journal
        </Button>
      </div>

      <nav aria-label="Archive sections" className="flex gap-2 border-b border-border-subtle pb-2">
        <button
          type="button"
          onClick={() => setTab('archived')}
          aria-current={tab === 'archived' ? 'page' : undefined}
          className={`rounded-md px-3 py-1.5 text-body-sm font-medium ${tab === 'archived' ? 'bg-surface text-text-primary' : 'text-text-secondary hover:bg-surface hover:text-text-primary'}`}
        >
          Archived
        </button>
        <button
          type="button"
          onClick={() => setTab('deleted')}
          aria-current={tab === 'deleted' ? 'page' : undefined}
          className={`rounded-md px-3 py-1.5 text-body-sm font-medium ${tab === 'deleted' ? 'bg-surface text-text-primary' : 'text-text-secondary hover:bg-surface hover:text-text-primary'}`}
        >
          Recently deleted
        </button>
      </nav>

      {isLoading && (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      )}

      {data && data.items.length === 0 && (
        <EmptyState
          title={tab === 'archived' ? 'Nothing archived' : 'Nothing recently deleted'}
          description={tab === 'archived' ? 'Entries you archive will show up here.' : 'Deleted entries stay here until you restore them.'}
        />
      )}

      {data && data.items.length > 0 && (
        <ul className="flex flex-col gap-2">
          {data.items.map((entry) => (
            <JournalEntryCard key={entry.id} entry={entry} onSelect={(id) => router.push(`/journal/${id}`)} />
          ))}
        </ul>
      )}
    </div>
  );
}
