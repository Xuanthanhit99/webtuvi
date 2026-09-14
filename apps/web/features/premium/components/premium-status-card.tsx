'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { usePremiumStatus } from '../hooks/use-premium-status';

/** Compact status row for the Settings page (Phase 12 — "expose authenticated Premium status
 * through a safe backend endpoint or existing user/account response"). Reads exclusively from
 * `GET /payment/premium-status` — never computes Premium authority in the browser. */
export function PremiumStatusCard() {
  const { data, isLoading, isError, refetch, isFetching } = usePremiumStatus();

  if (isLoading) return <div role="status" aria-label="Đang tải trạng thái Premium"><Skeleton className="h-11 w-full" /></div>;
  if (isError || !data) return (
    <div role="alert" className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-body-sm text-text-secondary">Chưa thể tải trạng thái Premium.</p>
      <Button variant="secondary" size="sm" loading={isFetching} onClick={() => refetch()}>Thử lại</Button>
    </div>
  );

  const isPremium = data.isPremium;

  return (
    <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
      <div>
        <div className="mb-1 flex items-center gap-2">
          <p className="text-body-sm font-semibold text-text-secondary">Premium</p>
          <Badge variant={isPremium ? 'insight' : 'neutral'}>{isPremium ? 'Đang hoạt động' : 'Miễn phí'}</Badge>
        </div>
        <p className="text-body-sm text-text-secondary">
          {isPremium && data?.expiresAt
            ? `Có hiệu lực đến ${new Date(data.expiresAt).toLocaleDateString('vi-VN')}.`
            : 'Xem quyền lợi và thông tin gói Premium.'}
        </p>
      </div>
      <Link href="/premium" className="inline-flex min-h-11 items-center rounded-md border border-border-subtle px-3 text-body-sm text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-insight">
          {isPremium ? 'Quản lý gói' : 'Xem Premium'}
      </Link>
    </div>
  );
}
