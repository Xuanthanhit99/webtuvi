'use client';

import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { numerologyApi } from '../api/numerology-api';
import { NumerologyReadingView } from './numerology-reading-view';

export function NumerologyReadingDetail({ id, onClose }: { id: string; onClose: () => void }) {
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['numerology', 'readings', id], queryFn: () => numerologyApi.getReading(id) });

  return (
    <div className="flex flex-col gap-4">
      <Button variant="ghost" size="sm" onClick={onClose}>
        ← Back to Numerology
      </Button>
      {isLoading && <Skeleton className="h-64 w-full" />}
      {isError && <ErrorState description="Couldn't load that reading." onRetry={() => refetch()} />}
      {data && <NumerologyReadingView reading={data} onChanged={() => refetch()} />}
    </div>
  );
}
