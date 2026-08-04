'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { journalApi } from '../api/journal-api';
import { JournalTimeline } from './journal-timeline';
import { JournalDetail } from './journal-detail';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';

/** `/journal`'s top-level shell — mirrors `/memory`'s own "?item=<id> opens the detail view in
 * place" pattern (`MemoryView`) for the timeline/detail split, while `/journal/new` and
 * `/journal/archive` are their own real routes (per the sprint's own explicit route list). */
export function JournalHome() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeId = searchParams.get('item');

  const createExport = useMutation({
    mutationFn: () => journalApi.export.account.create(),
    onSuccess: (job) => {
      const blob = new Blob([JSON.stringify(job.result, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `beaconvie-journal-export-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Your journal export has downloaded.');
    },
    onError: () => toast.error("Couldn't create an export right now. Please try again."),
  });

  function selectEntry(id: string | null) {
    router.replace(id ? `/journal?item=${id}` : '/journal', { scroll: false });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-heading-lg text-text-primary">Journal</h1>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => router.push('/journal/archive')}>
            Archive
          </Button>
          <Button variant="secondary" size="sm" onClick={() => createExport.mutate()} loading={createExport.isPending}>
            Export all
          </Button>
          <Button size="sm" onClick={() => router.push('/journal/new')}>
            New entry
          </Button>
        </div>
      </div>

      {activeId ? <JournalDetail id={activeId} onClose={() => selectEntry(null)} /> : <JournalTimeline onSelect={selectEntry} />}
    </div>
  );
}
