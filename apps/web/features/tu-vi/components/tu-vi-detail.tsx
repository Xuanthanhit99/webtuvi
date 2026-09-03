'use client';

import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { tuViApi } from '../api/tu-vi-api';
import { TuViChartView } from './tu-vi-chart-view';

export function TuViDetail({ id, onClose }: { id: string; onClose: () => void }) {
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['tu-vi', 'charts', id], queryFn: () => tuViApi.getChart(id) });

  return (
    <div className="flex flex-col gap-4">
      <Button variant="ghost" size="sm" onClick={onClose}>
        ← Quay lại Lá số Tử Vi
      </Button>
      {isLoading && <Skeleton className="h-[520px] w-full rounded-[20px]" />}
      {isError && <ErrorState description="Chưa thể tải lá số này." onRetry={() => refetch()} />}
      {data && (
        <TuViChartView
          chart={data}
          onChanged={async () => {
            await refetch();
          }}
        />
      )}
    </div>
  );
}
