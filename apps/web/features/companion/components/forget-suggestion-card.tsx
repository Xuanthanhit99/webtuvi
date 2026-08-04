'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ForgetSuggestionDto } from '@beaconvie/types';
import { companionMemoryApi } from '../api/companion-memory-api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';

export interface ForgetSuggestionCardProps {
  suggestion: ForgetSuggestionDto;
  onResolved: () => void;
}

/**
 * Phase 5: detected forget-intent ("Forget that," "Never remember my health stuff," "Delete
 * everything about my ex") is never executed by the detector itself — this card is the one and
 * only confirmation step before anything is actually deleted or consent is changed. "Cancel"
 * does nothing to the Memory API at all.
 */
export function ForgetSuggestionCard({ suggestion, onResolved }: ForgetSuggestionCardProps) {
  const queryClient = useQueryClient();

  const confirmDelete = useMutation({
    mutationFn: () => companionMemoryApi.confirmDelete(suggestion.candidates.map((c) => c.memoryId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memory-timeline'] });
      toast.success(suggestion.candidates.length === 1 ? 'Forgotten.' : `Forgot ${suggestion.candidates.length} memories.`);
      onResolved();
    },
    onError: () => toast.error("Couldn't forget that right now. Please try again."),
  });

  const confirmNeverRemember = useMutation({
    mutationFn: () => companionMemoryApi.confirmNeverRemember(suggestion.type!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memory-consents'] });
      toast.success("Got it — I won't remember that type anymore.");
      onResolved();
    },
    onError: () => toast.error("Couldn't update your memory settings. Please try again."),
  });

  const hasAction = suggestion.kind === 'NEVER_REMEMBER_TYPE' || suggestion.candidates.length > 0;

  return (
    <Card className="flex flex-col gap-2" aria-label="Forget suggestion">
      <Badge variant="neutral">Forget</Badge>
      <p className="text-body-sm text-text-secondary">{suggestion.message}</p>

      {suggestion.candidates.length > 0 && (
        <ul className="flex flex-col gap-1">
          {suggestion.candidates.map((candidate) => (
            <li key={candidate.memoryId} className="text-body-sm text-text-primary">
              {candidate.title}
            </li>
          ))}
        </ul>
      )}

      {hasAction && (
        <div className="flex gap-2 pt-1">
          <Button
            size="sm"
            variant="danger"
            loading={confirmDelete.isPending || confirmNeverRemember.isPending}
            onClick={() => (suggestion.kind === 'NEVER_REMEMBER_TYPE' ? confirmNeverRemember.mutate() : confirmDelete.mutate())}
          >
            Yes, forget
          </Button>
          <Button size="sm" variant="secondary" onClick={onResolved}>
            Cancel
          </Button>
        </div>
      )}
      {!hasAction && (
        <div className="pt-1">
          <Button size="sm" variant="secondary" onClick={onResolved}>
            Okay
          </Button>
        </div>
      )}
    </Card>
  );
}
