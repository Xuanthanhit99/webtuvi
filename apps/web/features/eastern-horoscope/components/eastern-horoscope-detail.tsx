'use client';

import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { easternHoroscopeApi } from '../api/eastern-horoscope-api';
import { EasternHoroscopeProfileView } from './eastern-horoscope-profile-view';

export function EasternHoroscopeDetail({ id, onClose }: { id: string; onClose: () => void }) {
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['eastern-horoscope', 'profiles', id], queryFn: () => easternHoroscopeApi.getProfile(id) });

  return (
    <div className="flex flex-col gap-4">
      <Button variant="ghost" size="sm" onClick={onClose}>
        ← Back to Ngũ Hành Phương Đông
      </Button>
      {isLoading && <Skeleton className="h-64 w-full" />}
      {isError && <ErrorState description="Couldn't load that profile." onRetry={() => refetch()} />}
      {data && (
        <EasternHoroscopeProfileView
          profile={data}
          onChanged={async () => {
            await refetch();
          }}
        />
      )}
    </div>
  );
}
