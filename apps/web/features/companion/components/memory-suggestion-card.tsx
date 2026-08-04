'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { MemorySuggestionDto, MemoryConsentModeValue } from '@beaconvie/types';
import { memoryApi } from '@/features/memory/api/memory-api';
import { companionMemoryApi } from '../api/companion-memory-api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';

export interface MemorySuggestionCardProps {
  suggestion: MemorySuggestionDto;
  sourceConversationId: string;
  sourceMessageId: string;
  onResolved: () => void;
}

/**
 * Phase 4: "This sounds worth remembering." Every button here maps to an existing Sprint 3A/3B
 * mutation — Remember reuses the same propose+accept flow as `RememberThisButton`, the three
 * consent buttons reuse the existing consent API. Nothing is ever saved just by this card
 * appearing; it disappears (via `onResolved`) once the user picks any option, never on its own.
 */
export function MemorySuggestionCard({ suggestion, sourceConversationId, sourceMessageId, onResolved }: MemorySuggestionCardProps) {
  const queryClient = useQueryClient();

  const remember = useMutation({
    mutationFn: async () => {
      const candidate = await memoryApi.candidates.propose({
        proposedType: suggestion.type,
        proposedTitle: suggestion.title,
        proposedSummary: suggestion.summary,
        sourceConversationId,
        sourceMessageId,
        reason: suggestion.reason,
      });
      if (candidate.status === 'PENDING_CONSENT') return { pending: true };
      await memoryApi.candidates.accept(candidate.id);
      return { pending: false };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['memory-timeline'] });
      toast.success(result.pending ? "Saved to Settings → Memory → Pending — your memory settings currently ask first." : 'Remembered.');
      onResolved();
    },
    onError: () => toast.error("Couldn't remember that right now. Please try again."),
  });

  const dismiss = useMutation({
    mutationFn: () => companionMemoryApi.dismissSuggestion(suggestion.type),
    onSuccess: onResolved,
    onError: onResolved, // "Not now" should never get the user stuck even if the tracking call fails
  });

  const setConsent = useMutation({
    mutationFn: (mode: MemoryConsentModeValue) => memoryApi.consents.updateType(suggestion.type, mode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memory-consents'] });
      onResolved();
    },
    onError: () => toast.error("Couldn't update your memory settings. Please try again."),
  });

  const pending = remember.isPending || dismiss.isPending || setConsent.isPending;

  return (
    <Card className="flex flex-col gap-2" aria-label="Memory suggestion">
      <div className="flex items-center gap-2">
        <Badge variant="new">This sounds worth remembering</Badge>
        <Badge variant="neutral">{suggestion.type.replace(/_/g, ' ').toLowerCase()}</Badge>
      </div>
      <p className="text-body-sm text-text-secondary">{suggestion.reason}</p>
      <div className="flex flex-wrap gap-2 pt-1">
        <Button size="sm" onClick={() => remember.mutate()} loading={remember.isPending} disabled={pending}>
          Remember
        </Button>
        <Button size="sm" variant="secondary" onClick={() => dismiss.mutate()} loading={dismiss.isPending} disabled={pending}>
          Not now
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setConsent.mutate('DENY_TYPE')} disabled={pending}>
          Never remember this type
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setConsent.mutate('ASK_EVERY_TIME')} disabled={pending}>
          Always ask
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setConsent.mutate('ALLOW_TYPE')} disabled={pending}>
          Always remember this type
        </Button>
      </div>
    </Card>
  );
}
