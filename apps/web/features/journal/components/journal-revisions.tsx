'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { journalApi } from '../api/journal-api';
import { Skeleton } from '@/components/ui/skeleton';

/** Phase 2/13's "revision history" surface — a full read-only content snapshot per meaningful
 * edit (see docs/architecture/journal-foundation.md "Revisions" for exactly when one is taken). */
export function JournalRevisions({ id }: { id: string }) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const { data: revisions, isLoading } = useQuery({
    queryKey: ['journal', id, 'revisions'],
    queryFn: () => journalApi.revisions(id),
  });

  if (isLoading) return <Skeleton className="h-32 w-full" />;
  if (!revisions || revisions.length === 0) {
    return <p className="text-body-sm text-text-secondary">No revision history yet.</p>;
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border border-border-subtle bg-surface p-4">
      <p className="text-body-sm font-semibold text-text-secondary">Revision history</p>
      <ul className="flex flex-col gap-2">
        {revisions.map((revision) => (
          <li key={revision.version} className="rounded-sm border border-border-subtle p-3">
            <button
              type="button"
              onClick={() => setExpanded((v) => (v === revision.version ? null : revision.version))}
              className="flex w-full items-center justify-between text-left text-body-sm"
            >
              <span>
                Version {revision.version} — {revision.changeReason}
              </span>
              <span className="text-caption text-text-tertiary">{new Date(revision.createdAt).toLocaleString()}</span>
            </button>
            {expanded === revision.version && (
              <div className="mt-2 border-t border-border-subtle pt-2">
                <p className="font-medium text-text-primary">{revision.title}</p>
                <p className="whitespace-pre-wrap text-body-sm text-text-secondary">{revision.content}</p>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
