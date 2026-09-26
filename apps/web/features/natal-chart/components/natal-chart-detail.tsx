'use client';

import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { natalChartApi } from '../api/natal-chart-api';
import { NatalChartView } from './natal-chart-view';

export function NatalChartDetail({ id, onClose }: { id: string; onClose: () => void }) {
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['natal-chart', 'charts', id], queryFn: () => natalChartApi.getChart(id) });

  return (
    <div className="flex flex-col gap-4">
      <Button variant="ghost" size="sm" onClick={onClose}>
        ← Quay lại Bản đồ sao
      </Button>
      {isLoading && <Skeleton className="h-64 w-full" />}
      {isError && <ErrorState description="Chưa thể tải Bản đồ sao này." onRetry={() => refetch()} />}
      {data && <NatalChartView chart={data} onChanged={() => refetch()} />}
    </div>
  );
}
