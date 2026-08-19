'use client';

import { useQuery } from '@tanstack/react-query';
import type { AdminNotificationHealthDto, AdminNotificationHealthWindowDto } from '@beaconvie/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
import { adminApi } from '../api/admin-api';

/** Interim Sprint — Admin Operator Tooling. Aggregate, not user-scoped. Deliberately does not claim
 * to know whether today's scheduler run executed — that telemetry isn't persisted anywhere yet (see
 * docs/audit/admin-operator-tooling-pre-implementation-audit.md §8) — this panel says so plainly
 * rather than showing a blank space that looks like an oversight. */
export function AdminNotificationHealthPanel() {
  const query = useQuery<AdminNotificationHealthDto>({
    queryKey: ['admin', 'notification-health'],
    queryFn: () => adminApi.getNotificationHealth(),
  });

  return (
    <Card className="flex flex-col gap-4">
      <div>
        <h2 className="text-body-lg font-medium text-text-primary">Notification health</h2>
        <p className="text-body-sm text-text-secondary">
          Delivery counts by type, from real notification records. Scheduler-run execution itself is not currently tracked.
        </p>
      </div>

      {query.isLoading && (
        <div role="status">
          <span className="sr-only">Loading notification health…</span>
          <Skeleton className="h-24 w-full" />
        </div>
      )}
      {query.isError && <ErrorState title="Couldn’t load notification health" onRetry={() => query.refetch()} />}

      {query.data && (
        <div className="flex flex-col gap-4">
          <p className="text-body-xs text-text-tertiary">Scheduler-run telemetry: not collected (log/Sentry search only).</p>
          <HealthWindow title="Last 24 hours" rows={query.data.last24h} />
          <HealthWindow title="Last 7 days" rows={query.data.last7d} />
        </div>
      )}
    </Card>
  );
}

function HealthWindow({ title, rows }: { title: string; rows: AdminNotificationHealthWindowDto[] }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-body-sm font-medium text-text-primary">{title}</h3>
      {rows.length === 0 ? (
        <EmptyState title="No notifications in this window" />
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map((row) => (
            <li key={`${row.type}-${row.emailStatus}`} className="flex items-center gap-2 rounded-md border border-border-subtle px-3 py-2 text-body-sm">
              <span className="text-text-primary">{row.type}</span>
              <Badge variant={row.emailStatus === 'FAILED' ? 'high' : row.emailStatus === 'SENT' ? 'new' : 'neutral'}>{row.emailStatus}</Badge>
              <span className="ml-auto text-text-tertiary">{row.count}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
