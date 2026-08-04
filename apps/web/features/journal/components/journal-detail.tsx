'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { journalApi } from '../api/journal-api';
import { JournalEditor } from './journal-editor';
import { JournalRevisions } from './journal-revisions';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { toast } from '@/components/ui/toast';

export function JournalDetail({ id, onClose }: { id: string; onClose: () => void }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showRevisions, setShowRevisions] = useState(false);

  const { data: entry, isLoading, isError, refetch } = useQuery({
    queryKey: ['journal', id],
    queryFn: () => journalApi.get(id),
  });

  const archive = useMutation({
    mutationFn: () => journalApi.archive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal'] });
      toast.success('Archived.');
      onClose();
    },
    onError: () => toast.error("Couldn't archive that. Please try again."),
  });

  const restore = useMutation({
    mutationFn: () => journalApi.restore(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal'] });
      toast.success('Restored.');
      refetch();
    },
    onError: () => toast.error("Couldn't restore that. Please try again."),
  });

  const duplicate = useMutation({
    mutationFn: () => journalApi.duplicate(id),
    onSuccess: (copy) => {
      queryClient.invalidateQueries({ queryKey: ['journal'] });
      toast.success('Duplicated as a new draft.');
      router.push(`/journal/${copy.id}`);
    },
    onError: () => toast.error("Couldn't duplicate that. Please try again."),
  });

  const remove = useMutation({
    mutationFn: () => journalApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal'] });
      setConfirmDelete(false);
      toast.success('Moved to Recently deleted.');
      onClose();
    },
    onError: () => {
      setConfirmDelete(false);
      toast.error("Couldn't delete that. Please try again.");
    },
  });

  const exportMarkdown = useMutation({
    mutationFn: () => journalApi.export.markdown(id),
    onSuccess: (result) => {
      const blob = new Blob([result.content], { type: 'text/markdown' });
      downloadBlob(blob, result.filename);
      toast.success('Exported as Markdown.');
    },
    onError: () => toast.error("Couldn't export right now. Please try again."),
  });

  const exportJson = useMutation({
    mutationFn: () => journalApi.export.json(id),
    onSuccess: (result) => {
      const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
      downloadBlob(blob, `${result.id}.json`);
      toast.success('Exported as JSON.');
    },
    onError: () => toast.error("Couldn't export right now. Please try again."),
  });

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }
  if (isError || !entry) {
    return <ErrorState description="That journal entry couldn't be found." onRetry={() => refetch()} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={onClose}>
          Back
        </Button>
        <div className="flex flex-wrap gap-2">
          {entry.state !== 'DELETED' && entry.state !== 'ARCHIVED' && (
            <Button size="sm" variant="secondary" onClick={() => archive.mutate()} loading={archive.isPending}>
              Archive
            </Button>
          )}
          {(entry.state === 'ARCHIVED' || entry.state === 'DELETED') && (
            <Button size="sm" variant="secondary" onClick={() => restore.mutate()} loading={restore.isPending}>
              Restore
            </Button>
          )}
          <Button size="sm" variant="secondary" onClick={() => duplicate.mutate()} loading={duplicate.isPending}>
            Duplicate
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setShowRevisions((v) => !v)}>
            {showRevisions ? 'Hide history' : 'History'}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => exportMarkdown.mutate()} loading={exportMarkdown.isPending}>
            Export .md
          </Button>
          <Button size="sm" variant="ghost" onClick={() => exportJson.mutate()} loading={exportJson.isPending}>
            Export .json
          </Button>
          {entry.state !== 'DELETED' && (
            <Button size="sm" variant="danger" onClick={() => setConfirmDelete(true)}>
              Delete
            </Button>
          )}
        </div>
      </div>

      {entry.state === 'DELETED' && (
        <p className="rounded-md border border-caution/40 bg-caution/10 px-4 py-2 text-body-sm text-text-primary">
          This entry is in Recently deleted. Restore it to keep editing.
        </p>
      )}
      {entry.state === 'ARCHIVED' && (
        <p className="rounded-md border border-border-subtle bg-surface-raised px-4 py-2 text-body-sm text-text-secondary">
          This entry is archived. Restore it to keep editing.
        </p>
      )}

      {entry.state === 'ARCHIVED' || entry.state === 'DELETED' ? (
        <div className="flex flex-col gap-2 rounded-md border border-border-subtle bg-surface p-4">
          <p className="font-display text-heading-md text-text-primary">{entry.title || 'Untitled entry'}</p>
          <p className="whitespace-pre-wrap text-body-md text-text-primary">{entry.content}</p>
        </div>
      ) : (
        <JournalEditor entry={entry} />
      )}

      {showRevisions && <JournalRevisions id={id} />}

      <Dialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete this entry?"
        description="It moves to Recently deleted, where you can restore it later — this is not permanent."
        variant="destructive"
      >
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirmDelete(false)}>
            Cancel
          </Button>
          <Button variant="danger" loading={remove.isPending} onClick={() => remove.mutate()}>
            Delete
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
