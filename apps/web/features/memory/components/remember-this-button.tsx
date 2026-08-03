'use client';

import { useState } from 'react';
import { BookmarkPlus } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { MemoryTypeValue } from '@beaconvie/types';
import { memoryApi } from '../api/memory-api';
import { Dialog } from '@/components/ui/dialog';
import { Dropdown } from '@/components/ui/dropdown';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { toast } from '@/components/ui/toast';

const TYPE_OPTIONS: { value: MemoryTypeValue; label: string }[] = [
  { value: 'GOAL', label: 'Goal' },
  { value: 'IDENTITY', label: 'Identity' },
  { value: 'PREFERENCE', label: 'Preference' },
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

export interface RememberThisButtonProps {
  conversationId: string;
  messageId: string;
  content: string;
}

/**
 * The one and only way Companion-side content can become a memory candidate
 * in Sprint 3A — an explicit user action on their own message. Never
 * automatic, never from an assistant reply (the backend independently
 * enforces this — see MemoryCandidateService.propose). Proposing and
 * accepting happen as one user-facing step ("Remember this"); if consent
 * currently blocks it, the memory lands in Settings → Memory → Pending
 * instead of silently failing.
 */
export function RememberThisButton({ conversationId, messageId, content }: RememberThisButtonProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<MemoryTypeValue>('GOAL');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState(content);

  const remember = useMutation({
    mutationFn: async () => {
      const candidate = await memoryApi.candidates.propose({
        proposedType: type,
        proposedTitle: title.trim() || content.slice(0, 60),
        proposedSummary: summary.trim(),
        sourceConversationId: conversationId,
        sourceMessageId: messageId,
        reason: 'Remembered from a Companion conversation.',
      });
      if (candidate.status === 'PENDING_CONSENT') {
        return { pending: true };
      }
      await memoryApi.candidates.accept(candidate.id);
      return { pending: false };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['memory-timeline'] });
      queryClient.invalidateQueries({ queryKey: ['memory-candidates'] });
      setOpen(false);
      toast.success(
        result.pending
          ? "Your memory settings currently block this — it's waiting in Settings → Memory → Pending."
          : 'Remembered.',
      );
    },
    onError: () => toast.error("Couldn't remember that right now. Please try again."),
  });

  return (
    <>
      <IconButton aria-label="Remember this" onClick={() => setOpen(true)}>
        <BookmarkPlus className="h-3.5 w-3.5" aria-hidden="true" />
      </IconButton>

      <Dialog open={open} onClose={() => setOpen(false)} title="Remember this?" description="BeaconVie will save this as a memory you can view, edit the title of, or delete anytime.">
        <div className="flex flex-col gap-3">
          <Dropdown id="remember-type" label="What kind of memory is this?" value={type} options={TYPE_OPTIONS} onChange={(v) => setType(v as MemoryTypeValue)} />
          <div>
            <label htmlFor="remember-title" className="mb-2 block text-body-sm font-medium text-text-primary">
              Title
            </label>
            <input
              id="remember-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={content.slice(0, 60)}
              maxLength={200}
              className="h-11 w-full rounded-md border border-border-subtle bg-surface px-3 text-body-md text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-insight"
            />
          </div>
          <div>
            <label htmlFor="remember-summary" className="mb-2 block text-body-sm font-medium text-text-primary">
              What should BeaconVie remember?
            </label>
            <textarea
              id="remember-summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={3}
              maxLength={2000}
              className="w-full resize-y rounded-md border border-border-subtle bg-surface px-3 py-2 text-body-md text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-insight"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button loading={remember.isPending} disabled={!summary.trim()} onClick={() => remember.mutate()}>
              Remember this
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
