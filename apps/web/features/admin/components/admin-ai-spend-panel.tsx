'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { AdminAiSpendDto } from '@beaconvie/types';
import { Card } from '@/components/ui/card';
import { Dropdown } from '@/components/ui/dropdown';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { adminApi } from '../api/admin-api';

const WINDOW_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: 'Last 7 days' },
];

/** Interim Sprint — Admin Operator Tooling. Server-side aggregates only — no prompt/completion
 * content field exists anywhere in this component or the API response it renders (neither AIUsage
 * nor ProviderLog stores any). See docs/audit/admin-operator-tooling-pre-implementation-audit.md §9
 * for why failureCount is deliberately null, not a wrong number, whenever a user filter is applied. */
export function AdminAiSpendPanel() {
  const [window, setWindow] = useState<'today' | '7d'>('today');

  const query = useQuery<AdminAiSpendDto>({
    queryKey: ['admin', 'ai-spend', window],
    queryFn: () => adminApi.getAiSpend({ window }),
  });

  return (
    <Card className="flex flex-col gap-4">
      <div>
        <h2 className="text-body-lg font-medium text-text-primary">AI spend</h2>
        <p className="text-body-sm text-text-secondary">Aggregate spend and request counts. Never conversation content.</p>
      </div>

      <Dropdown id="admin-ai-spend-window" label="Window" value={window} options={WINDOW_OPTIONS} onChange={(v) => setWindow(v as 'today' | '7d')} className="max-w-xs" />

      {query.isLoading && (
        <div role="status">
          <span className="sr-only">Loading AI spend…</span>
          <Skeleton className="h-24 w-full" />
        </div>
      )}
      {query.isError && <ErrorState title="Couldn’t load AI spend" onRetry={() => query.refetch()} />}

      {query.data && (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-body-sm tablet:grid-cols-3">
          <div>
            <dt className="text-text-tertiary">Estimated cost</dt>
            <dd className="text-body-md font-medium text-text-primary">${query.data.estimatedCostUsd.toFixed(4)}</dd>
          </div>
          <div>
            <dt className="text-text-tertiary">Requests</dt>
            <dd className="text-body-md font-medium text-text-primary">{query.data.requestCount}</dd>
          </div>
          <div>
            <dt className="text-text-tertiary">Failures</dt>
            <dd className="text-body-md font-medium text-text-primary">
              {query.data.failureCount === null ? 'N/A (user-filtered)' : query.data.failureCount}
            </dd>
          </div>
        </dl>
      )}
    </Card>
  );
}
