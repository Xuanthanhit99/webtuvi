'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { journalApi } from '../api/journal-api';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';

/** Creates a real DRAFT immediately (mirroring Companion's own "New conversation" — a real row
 * exists before the user types anything, which is what makes autosave/"recovery after refresh"
 * possible from the very first keystroke) and redirects to the editor. */
export function JournalNew() {
  const router = useRouter();
  const [error, setError] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    journalApi
      .create({ title: '', content: '' })
      .then((entry) => router.replace(`/journal/${entry.id}`))
      .catch(() => setError(true));
  }, [router]);

  if (error) {
    return (
      <ErrorState
        description="Couldn't start a new entry right now."
        onRetry={() => {
          startedRef.current = false;
          setError(false);
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-10 w-1/2" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
