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
  const { data, isLoading } = usePremiumStatus();

  if (isLoading) return <Skeleton className="h-11 w-full" />;

  const isPremium = data?.isPremium ?? false;

  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <div className="mb-1 flex items-center gap-2">
          <p className="text-body-sm font-semibold text-text-secondary">Premium</p>
          <Badge variant={isPremium ? 'insight' : 'neutral'}>{isPremium ? 'Active' : 'Free plan'}</Badge>
        </div>
        <p className="text-body-sm text-text-secondary">
          {isPremium && data?.expiresAt
            ? `Active until ${new Date(data.expiresAt).toLocaleDateString()}.`
            : 'Higher Tarot daily limits, deeper interpretations, and unlimited reading history.'}
        </p>
      </div>
      <Link href="/premium">
        <Button variant="secondary" size="sm">
          {isPremium ? 'Manage' : 'Upgrade'}
        </Button>
      </Link>
    </div>
  );
}
