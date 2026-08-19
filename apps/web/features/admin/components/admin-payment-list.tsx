'use client';

import { useQuery } from '@tanstack/react-query';
import type { AdminPaymentOrderDto } from '@beaconvie/types';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { adminApi } from '../api/admin-api';

const STATUS_VARIANT: Record<AdminPaymentOrderDto['status'], 'new' | 'high' | 'neutral'> = {
  PAID: 'new',
  PENDING: 'neutral',
  FAILED: 'high',
  EXPIRED: 'neutral',
  CANCELLED: 'neutral',
};

/** Interim Sprint — Admin Operator Tooling. Safe fields only — never renders
 * providerPaymentLinkId/providerCheckoutUrl/raw metadata (the API response never includes them in
 * the first place, so there is nothing to accidentally render here). No refund/retry/repair control
 * exists anywhere in this sprint. */
export function AdminPaymentList({ userId }: { userId: string }) {
  const query = useQuery<AdminPaymentOrderDto[]>({
    queryKey: ['admin', 'payments', userId],
    queryFn: () => adminApi.getPaymentsForUser(userId),
  });

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-body-sm font-medium text-text-primary">Payment history</h3>
      {query.isLoading && <Skeleton className="h-12 w-full" />}
      {query.isError && <p className="text-body-sm text-text-secondary">Couldn’t load payment history.</p>}
      {query.data && query.data.length === 0 && <p className="text-body-sm text-text-secondary">No orders on record.</p>}
      {query.data && query.data.length > 0 && (
        <ul className="flex flex-col gap-2">
          {query.data.map((order) => (
            <li key={order.id} className="flex flex-wrap items-center gap-2 rounded-md border border-border-subtle px-3 py-2 text-body-sm">
              <Badge variant={STATUS_VARIANT[order.status]}>{order.status}</Badge>
              <span className="text-text-primary">
                {order.amount.toLocaleString()} {order.currency}
              </span>
              <span className="text-text-secondary">{order.product}</span>
              <span className="text-text-tertiary">{order.provider} · {order.providerOrderCode}</span>
              <span className="text-text-tertiary">{new Date(order.createdAt).toLocaleDateString()}</span>
              {order.entitlement && <Badge variant="insight">entitlement {order.entitlement.id.slice(0, 8)}…</Badge>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
