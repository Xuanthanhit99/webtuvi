'use client';

import { useQuery } from '@tanstack/react-query';
import type { AdminEntitlementRecordDto } from '@beaconvie/types';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { adminApi } from '../api/admin-api';

/** Interim Sprint — Admin Operator Tooling. Read-only — no grant/revoke/extend control exists here
 * or anywhere in this sprint. Reuses the API's own EntitlementService via the admin endpoint, never
 * a parallel calculation. */
export function AdminEntitlementList({ userId }: { userId: string }) {
  const query = useQuery<AdminEntitlementRecordDto[]>({
    queryKey: ['admin', 'entitlement', userId],
    queryFn: () => adminApi.getEntitlement(userId),
  });

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-body-sm font-medium text-text-primary">Premium entitlement history</h3>
      {query.isLoading && <Skeleton className="h-12 w-full" />}
      {query.isError && <p className="text-body-sm text-text-secondary">Couldn’t load entitlement history.</p>}
      {query.data && query.data.length === 0 && <p className="text-body-sm text-text-secondary">No entitlement history — never purchased Premium.</p>}
      {query.data && query.data.length > 0 && (
        <ul className="flex flex-col gap-2">
          {query.data.map((entitlement) => (
            <li key={entitlement.id} className="flex flex-wrap items-center gap-2 rounded-md border border-border-subtle px-3 py-2 text-body-sm">
              <Badge variant={entitlement.status === 'ACTIVE' ? 'new' : entitlement.status === 'REVOKED' ? 'high' : 'neutral'}>
                {entitlement.status}
              </Badge>
              <span className="text-text-primary">{entitlement.source}</span>
              <span className="text-text-tertiary">
                {new Date(entitlement.startsAt).toLocaleDateString()} –{' '}
                {entitlement.expiresAt ? new Date(entitlement.expiresAt).toLocaleDateString() : 'no expiry'}
              </span>
              <span className="text-text-tertiary">order {entitlement.orderId}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
