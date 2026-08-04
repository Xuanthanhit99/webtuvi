'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { MemoryReferenceDto } from '@beaconvie/types';
import { memoryApi } from '@/features/memory/api/memory-api';
import { ImportanceBadge } from '@/features/memory/components/importance-badge';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/toast';

export interface MemoryCardProps {
  reference: MemoryReferenceDto;
  /** Rendered above the summary — typically "I remembered this because..." or the skip headline. */
  explanationText?: string;
  onViewed?: () => void;
}

/**
 * Phase 6's "Memory Card": Title, Summary, Reason, Created, Importance, Source, with
 * View/Forget/Edit actions. Summary/created are fetched from the real, current `Memory` row
 * (`GET /memory/:id`) rather than duplicated onto the reference — a reference is a citation,
 * not a content copy, so it always reflects the memory's *current* state (e.g. if it was
 * edited or archived since this reply was generated).
 */
export function MemoryCard({ reference, explanationText, onViewed }: MemoryCardProps) {
  const queryClient = useQueryClient();
  const [confirmForget, setConfirmForget] = useState(false);
  const [editingTitle, setEditingTitle] = useState<string | null>(null);

  const { data: memory, isLoading, isError } = useQuery({
    queryKey: ['memory', reference.memoryId],
    queryFn: () => memoryApi.get(reference.memoryId),
  });

  const forget = useMutation({
    mutationFn: () => memoryApi.remove(reference.memoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memory-timeline'] });
      setConfirmForget(false);
      toast.success('Memory permanently deleted.');
    },
    onError: () => {
      setConfirmForget(false);
      toast.error("Couldn't delete that. Please try again.");
    },
  });

  const rename = useMutation({
    mutationFn: (title: string) => memoryApi.update(reference.memoryId, { title }),
    onSuccess: (updated) => {
      queryClient.setQueryData(['memory', reference.memoryId], updated);
      queryClient.invalidateQueries({ queryKey: ['memory-timeline'] });
      setEditingTitle(null);
      toast.success('Memory updated.');
    },
    onError: () => toast.error("Couldn't update that. Please try again."),
  });

  if (isLoading) {
    return (
      <Card className="flex flex-col gap-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-10 w-full" />
      </Card>
    );
  }

  if (isError || !memory) {
    return (
      <Card className="flex flex-col gap-1">
        <p className="text-body-sm text-text-secondary">This memory is no longer available — it may have been deleted.</p>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-2" aria-label="Memory card">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Badge variant="insight">{memory.type.replace(/_/g, ' ').toLowerCase()}</Badge>
        <ImportanceBadge score={reference.importance.score} explanations={reference.importance.explanations} pinned={reference.retrievalType === 'PINNED'} />
      </div>

      {editingTitle !== null ? (
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (editingTitle.trim()) rename.mutate(editingTitle.trim());
          }}
        >
          <label htmlFor={`memory-card-title-${reference.memoryId}`} className="sr-only">
            Memory title
          </label>
          <input
            id={`memory-card-title-${reference.memoryId}`}
            value={editingTitle}
            onChange={(e) => setEditingTitle(e.target.value)}
            maxLength={200}
            className="h-9 flex-1 rounded-md border border-border-subtle bg-surface px-3 text-body-md text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-insight"
          />
          <Button type="submit" size="sm" loading={rename.isPending}>
            Save
          </Button>
          <Button type="button" size="sm" variant="secondary" onClick={() => setEditingTitle(null)}>
            Cancel
          </Button>
        </form>
      ) : (
        <p className="font-medium text-text-primary">{memory.title}</p>
      )}

      <p className="text-body-sm text-text-secondary">{memory.summary}</p>

      {explanationText && <p className="text-caption text-text-disabled">{explanationText}</p>}

      <p className="text-caption text-text-disabled">Created {new Date(memory.createdAt).toLocaleDateString()}</p>

      <div className="flex flex-wrap gap-2 pt-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            onViewed?.();
            window.location.assign(`/memory?item=${reference.memoryId}`);
          }}
        >
          View
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setEditingTitle(memory.title)}>
          Edit
        </Button>
        <Button size="sm" variant="danger" onClick={() => setConfirmForget(true)}>
          Forget
        </Button>
      </div>

      <Dialog
        open={confirmForget}
        onClose={() => setConfirmForget(false)}
        title="Forget this memory?"
        description="This permanently deletes it. This can't be undone."
        variant="destructive"
      >
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirmForget(false)}>
            Cancel
          </Button>
          <Button variant="danger" loading={forget.isPending} onClick={() => forget.mutate()}>
            Forget
          </Button>
        </div>
      </Dialog>
    </Card>
  );
}
