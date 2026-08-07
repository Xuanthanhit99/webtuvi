'use client';

import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { tarotApi } from '../api/tarot-api';
import { TarotReadingView } from './tarot-reading-view';

export function TarotReadingDetail({ id, onClose }: { id: string; onClose: () => void }) {
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['tarot', 'readings', id], queryFn: () => tarotApi.getReading(id) });

  return (
    <div className="flex flex-col gap-4">
      <Button variant="ghost" size="sm" onClick={onClose}>
        ← Back to Tarot
      </Button>
      {isLoading && <Skeleton className="h-64 w-full" />}
      {isError && <ErrorState description="Couldn't load that reading." onRetry={() => refetch()} />}
      {data && <TarotReadingView reading={data} onChanged={() => refetch()} />}
    </div>
  );
}
