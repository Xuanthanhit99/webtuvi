'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Archive, ArchiveRestore, Trash2 } from 'lucide-react';
import type { MemoryDto } from '@beaconvie/types';
import { memoryApi } from '../api/memory-api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { toast } from '@/components/ui/toast';

const TYPE_LABELS: Record<string, string> = {
  IDENTITY: 'Identity', PREFERENCE: 'Preference', GOAL: 'Goal', RELATIONSHIP: 'Relationship',
  HABIT: 'Habit', ROUTINE: 'Routine', ACHIEVEMENT: 'Achievement', CHALLENGE: 'Challenge',
  EMOTION: 'Emotion', IMPORTANT_EVENT: 'Important event', DECISION: 'Decision', INTEREST: 'Interest',
  WORK: 'Work', STUDY: 'Study', PET: 'Pet', LOCATION_PREFERENCE: 'Place preference', HEALTH: 'Health',
  CUSTOM: 'Other',
};

export function MemoryDetail({ memoryId, onClose }: { memoryId: string; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [showVersions, setShowVersions] = useState(false);
  const [showAudit, setShowAudit] = useState(false);

  const {
    data: memory,
    isLoading,
    isError,
  } = useQuery({ queryKey: ['memory', memoryId], queryFn: () => memoryApi.get(memoryId) });

  const { data: versions } = useQuery({
    queryKey: ['memory', memoryId, 'versions'],
    queryFn: () => memoryApi.versions(memoryId),
    enabled: showVersions,
  });

  const { data: auditTrail } = useQuery({
    queryKey: ['memory', memoryId, 'audit'],
    queryFn: () => memoryApi.auditTrail(memoryId),
    enabled: showAudit,
  });

  // refetchType: 'all' (not the default 'active') because the timeline is
  // unmounted while this detail view is open — an active-only invalidate
  // would just mark its cache stale without refetching, so closing back to
  // the timeline would remount it showing the still-cached, pre-change list
  // for a beat.
  function invalidateAfterChange(updated?: MemoryDto) {
    const result = Promise.all([
      queryClient.invalidateQueries({ queryKey: ['memory-timeline'], refetchType: 'all' }),
      queryClient.invalidateQueries({ queryKey: ['memories'], refetchType: 'all' }),
    ]);
    if (updated) queryClient.setQueryData(['memory', memoryId], updated);
    return result;
  }

  const updateTitle = useMutation({
    mutationFn: (title: string) => memoryApi.update(memoryId, { title }),
    onSuccess: (updated) => {
      invalidateAfterChange(updated);
      setEditingTitle(null);
      toast.success('Memory updated.');
    },
    onError: () => toast.error("Couldn't update that. Please try again."),
  });

  const archive = useMutation({
    mutationFn: () => memoryApi.archive(memoryId),
    onSuccess: (updated) => {
      invalidateAfterChange(updated);
      toast.success('Memory archived. You can restore it anytime.');
    },
    onError: () => toast.error("Couldn't archive that. Please try again."),
  });

  const restore = useMutation({
    mutationFn: () => memoryApi.restore(memoryId),
    onSuccess: (updated) => {
      invalidateAfterChange(updated);
      toast.success('Memory restored.');
    },
    onError: () => toast.error("Couldn't restore that. Please try again."),
  });

  const remove = useMutation({
    mutationFn: () => memoryApi.remove(memoryId),
    onSuccess: () => {
      invalidateAfterChange();
      setConfirmDelete(false);
      toast.success('Memory permanently deleted.');
      onClose();
    },
    onError: () => {
      setConfirmDelete(false);
      toast.error("Couldn't delete that. Please try again.");
    },
  });

  if (isLoading) {
    return (
      <Card className="flex flex-col gap-3">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-20 w-full" />
      </Card>
    );
  }

  if (isError || !memory) {
    return <ErrorState description="That memory couldn't be found — it may have been deleted." onRetry={onClose} />;
  }

  return (
    <Card className="flex flex-col gap-4" aria-label="Memory detail">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <Badge variant="insight">{TYPE_LABELS[memory.type] ?? memory.type}</Badge>
          {editingTitle !== null ? (
            <form
              className="mt-2 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (editingTitle.trim()) updateTitle.mutate(editingTitle.trim());
              }}
            >
              <label htmlFor="memory-title-edit" className="sr-only">
                Memory title
              </label>
              <input
                id="memory-title-edit"
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                maxLength={200}
                className="h-9 flex-1 rounded-md border border-border-subtle bg-surface px-3 text-body-md text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-insight"
              />
              <Button type="submit" size="sm" loading={updateTitle.isPending}>
                Save
              </Button>
              <Button type="button" size="sm" variant="secondary" onClick={() => setEditingTitle(null)}>
                Cancel
              </Button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setEditingTitle(memory.title)}
              className="mt-2 block text-left font-display text-heading-md text-text-primary hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-insight"
              aria-label={`Rename memory: ${memory.title}`}
            >
              {memory.title}
            </button>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>

      <p className="whitespace-pre-wrap text-body-md text-text-primary">{memory.summary}</p>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-body-sm">
        <dt className="text-text-secondary">Created</dt>
        <dd className="text-text-primary">{new Date(memory.createdAt).toLocaleString()}</dd>
        <dt className="text-text-secondary">Source</dt>
        <dd className="text-text-primary">{memory.sourceConversationId ? 'Linked to a conversation' : 'No linked source'}</dd>
        <dt className="text-text-secondary">Status</dt>
        <dd className="text-text-primary">{memory.status === 'ARCHIVED' ? 'Archived' : 'Active'}</dd>
      </dl>

      <div className="flex flex-wrap gap-2 border-t border-border-subtle pt-4">
        {memory.status === 'ARCHIVED' ? (
          <Button size="sm" variant="secondary" onClick={() => restore.mutate()} loading={restore.isPending}>
            <ArchiveRestore className="h-3.5 w-3.5" aria-hidden="true" />
            Restore
          </Button>
        ) : (
          <Button size="sm" variant="secondary" onClick={() => archive.mutate()} loading={archive.isPending}>
            <Archive className="h-3.5 w-3.5" aria-hidden="true" />
            Archive
          </Button>
        )}
        <Button size="sm" variant="danger" onClick={() => setConfirmDelete(true)}>
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          Delete
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setShowVersions((v) => !v)}>
          {showVersions ? 'Hide' : 'Show'} version history
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setShowAudit((v) => !v)}>
          {showAudit ? 'Hide' : 'Show'} activity history
        </Button>
      </div>

      {showVersions && (
        <section aria-label="Version history" className="border-t border-border-subtle pt-3">
          <h3 className="mb-2 text-body-sm font-semibold text-text-secondary">Version history</h3>
          {!versions ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <ul className="flex flex-col gap-2">
              {versions.map((v) => (
                <li key={v.version} className="text-body-sm text-text-secondary">
                  <span className="font-medium text-text-primary">v{v.version}</span> — {v.changeReason} —{' '}
                  {new Date(v.createdAt).toLocaleString()}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {showAudit && (
        <section aria-label="Activity history" className="border-t border-border-subtle pt-3">
          <h3 className="mb-2 text-body-sm font-semibold text-text-secondary">Activity history</h3>
          {!auditTrail ? (
            <Skeleton className="h-10 w-full" />
          ) : auditTrail.length === 0 ? (
            <p className="text-body-sm text-text-secondary">No activity recorded yet.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {auditTrail.map((entry) => (
                <li key={entry.id} className="text-body-sm text-text-secondary">
                  {entry.action.toLowerCase().replace('_', ' ')} — {new Date(entry.createdAt).toLocaleString()}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <Dialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete this memory?"
        description="This permanently deletes it. This can't be undone."
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
    </Card>
  );
}
