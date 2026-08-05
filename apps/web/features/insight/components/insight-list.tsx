'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { InsightStatusValue } from '@beaconvie/types';
import { insightApi } from '../api/insight-api';
import { InsightCandidateCard } from './insight-candidate-card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Dropdown } from '@/components/ui/dropdown';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'READY', label: 'Ready' },
  { value: 'NOT_READY', label: 'Not ready' },
  { value: 'INSUFFICIENT_EVIDENCE', label: 'Insufficient evidence' },
  { value: 'ARCHIVED', label: 'Archived' },
];

export function InsightList({ onSelect }: { onSelect: (id: string) => void }) {
  const [status, setStatus] = useState('');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['insight-candidates', 'list', status],
    queryFn: () => insightApi.list({ status: (status || undefined) as InsightStatusValue | undefined }),
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Dropdown id="insight-status-filter" label="Status" value={status} options={STATUS_OPTIONS} onChange={setStatus} className="w-56" />
      </div>

      {isLoading && (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      )}
      {isError && <ErrorState description="Couldn't load insight candidates." onRetry={() => refetch()} />}
      {data && data.items.length === 0 && (
        <EmptyState
          title="No insight candidates yet"
          description="As related reflections build up — supporting, repeating, or contradicting each other — they'll be prepared here."
        />
      )}
      {data && data.items.length > 0 && (
        <ul className="flex flex-col gap-2">
          {data.items.map((candidate) => (
            <InsightCandidateCard key={candidate.id} candidate={candidate} onSelect={onSelect} />
          ))}
        </ul>
      )}
    </div>
  );
}
