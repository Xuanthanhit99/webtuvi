'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { memoryApi } from '../api/memory-api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { toast } from '@/components/ui/toast';

export function CandidateReview() {
  const queryClient = useQueryClient();

  const { data: candidates, isLoading, isError, refetch } = useQuery({
    queryKey: ['memory-candidates'],
    queryFn: () => memoryApi.candidates.list(),
  });

  const pending = candidates?.filter((c) => c.status === 'CANDIDATE' || c.status === 'PENDING_CONSENT') ?? [];

  const accept = useMutation({
    mutationFn: (id: string) => memoryApi.candidates.accept(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memory-candidates'] });
      queryClient.invalidateQueries({ queryKey: ['memory-timeline'] });
      toast.success('Memory saved.');
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Couldn't accept that.";
      toast.error(message);
    },
  });

  const reject = useMutation({
    mutationFn: (id: string) => memoryApi.candidates.reject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memory-candidates'] });
      toast.success('Candidate dismissed — nothing was saved.');
    },
    onError: () => toast.error("Couldn't dismiss that. Please try again."),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState description="Couldn't load your pending memories." onRetry={() => refetch()} />;
  }

  if (pending.length === 0) {
    return (
      <EmptyState
        title="Nothing waiting for review."
        description="When you ask Mệnh Vi to remember something, it shows up here first so you can confirm it before it's saved."
      />
    );
  }

  return (
    <ul className="flex flex-col gap-3" aria-label="Pending memory candidates">
      {pending.map((candidate) => (
        <li key={candidate.id}>
          <Card className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <Badge variant="insight">{candidate.proposedType.replace(/_/g, ' ').toLowerCase()}</Badge>
              {candidate.status === 'PENDING_CONSENT' && <Badge variant="neutral">Blocked by your memory settings</Badge>}
            </div>
            <p className="font-medium text-text-primary">{candidate.proposedTitle}</p>
            <p className="text-body-sm text-text-secondary">{candidate.proposedSummary}</p>
            <div className="flex gap-2 pt-1">
              <Button size="sm" onClick={() => accept.mutate(candidate.id)} loading={accept.isPending}>
                Remember this
              </Button>
              <Button size="sm" variant="secondary" onClick={() => reject.mutate(candidate.id)} loading={reject.isPending}>
                Not this
              </Button>
            </div>
          </Card>
        </li>
      ))}
    </ul>
  );
}
