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

/**
 * Merge suggestions are never applied automatically — accepting one is the one explicit user
 * action that follows from a duplicate finding (it archives the duplicate memory, reversibly;
 * see MemoryRecordService.archive — nothing is hard-deleted or content-rewritten). Rejecting
 * one tells BeaconVie the pair isn't actually a duplicate, and it won't be re-suggested.
 */
export function MergeSuggestionsPanel() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['memory-merge-suggestions'],
    queryFn: () => memoryApi.intelligence.mergeSuggestions.list(),
  });

  function invalidateAfterResolution() {
    queryClient.invalidateQueries({ queryKey: ['memory-merge-suggestions'] });
    queryClient.invalidateQueries({ queryKey: ['memory-duplicates'] });
    queryClient.invalidateQueries({ queryKey: ['memory-timeline'] });
  }

  const accept = useMutation({
    mutationFn: (id: string) => memoryApi.intelligence.mergeSuggestions.accept(id),
    onSuccess: () => {
      invalidateAfterResolution();
      toast.success('Merged — the duplicate memory was archived, not deleted.');
    },
    onError: () => toast.error("Couldn't merge that. Please try again."),
  });

  const reject = useMutation({
    mutationFn: (id: string) => memoryApi.intelligence.mergeSuggestions.reject(id),
    onSuccess: () => {
      invalidateAfterResolution();
      toast.success("Got it — these won't be suggested as duplicates again.");
    },
    onError: () => toast.error("Couldn't dismiss that. Please try again."),
  });

  if (isLoading) return <Skeleton className="h-20 w-full" />;
  if (isError) return <ErrorState description="Couldn't load merge suggestions." onRetry={() => refetch()} />;

  const suggestions = data ?? [];
  if (suggestions.length === 0) {
    return <EmptyState title="No merge suggestions." description="When two memories look like duplicates, a suggestion to combine them will show up here — you always decide." />;
  }

  return (
    <ul className="flex flex-col gap-3" aria-label="Merge suggestions">
      {suggestions.map((suggestion) => (
        <li key={suggestion.id}>
          <Card className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Badge variant="insight">{suggestion.confidence}% confident</Badge>
            </div>
            <p className="text-body-sm text-text-secondary">{suggestion.reason}</p>
            <div className="flex flex-col gap-1 text-body-sm">
              <p>
                <span className="font-medium text-text-primary">Keep:</span> {suggestion.primaryTitle}
              </p>
              <p>
                <span className="font-medium text-text-primary">Archive:</span> {suggestion.duplicateTitle}
              </p>
            </div>
            <div className="flex gap-2 pt-1">
              <Button size="sm" onClick={() => accept.mutate(suggestion.id)} loading={accept.isPending}>
                Merge
              </Button>
              <Button size="sm" variant="secondary" onClick={() => reject.mutate(suggestion.id)} loading={reject.isPending}>
                Not duplicates
              </Button>
            </div>
          </Card>
        </li>
      ))}
    </ul>
  );
}
