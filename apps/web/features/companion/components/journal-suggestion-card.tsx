'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import type { JournalSuggestionDto } from '@beaconvie/types';
import { companionJournalApi } from '../api/companion-journal-api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';

export interface JournalSuggestionCardProps {
  suggestion: JournalSuggestionDto;
  sourceConversationId: string;
  sourceMessageId: string;
  onResolved: () => void;
}

/**
 * Phase 8: "This might be worth saving as a journal entry." Nothing is ever saved just by this
 * card appearing. "Save as Journal" creates a real DRAFT immediately (the click is the explicit
 * user action — see docs/architecture/journal-foundation.md "Companion integration") and
 * navigates to the editor, where the user still must review and explicitly Publish before it's a
 * finished entry — Companion never writes journal content, it only carries the user's own
 * already-sent message over verbatim. "Later" calls no API at all. "Never suggest again" disables
 * future suggestions for the account.
 */
export function JournalSuggestionCard({ suggestion, sourceConversationId, sourceMessageId, onResolved }: JournalSuggestionCardProps) {
  const router = useRouter();

  const save = useMutation({
    mutationFn: () => companionJournalApi.save(sourceConversationId, sourceMessageId),
    onSuccess: (entry) => {
      onResolved();
      router.push(`/journal/${entry.id}`);
    },
    onError: () => toast.error("Couldn't start that journal entry right now. Please try again."),
  });

  const neverAgain = useMutation({
    mutationFn: () => companionJournalApi.neverAgain(),
    onSuccess: () => {
      toast.success("Got it — I won't suggest journaling anymore.");
      onResolved();
    },
    onError: onResolved,
  });

  const pending = save.isPending || neverAgain.isPending;

  return (
    <Card className="flex flex-col gap-2" aria-label="Journal suggestion">
      <div className="flex items-center gap-2">
        <Badge variant="new">This might be worth saving as a journal entry</Badge>
      </div>
      <p className="text-body-sm text-text-secondary">{suggestion.reason}</p>
      <p className="text-body-sm italic text-text-disabled">“{suggestion.excerpt}”</p>
      <div className="flex flex-wrap gap-2 pt-1">
        <Button size="sm" onClick={() => save.mutate()} loading={save.isPending} disabled={pending}>
          Save as Journal
        </Button>
        <Button size="sm" variant="secondary" onClick={onResolved} disabled={pending}>
          Later
        </Button>
        <Button size="sm" variant="ghost" onClick={() => neverAgain.mutate()} disabled={pending}>
          Never suggest again
        </Button>
      </div>
    </Card>
  );
}
