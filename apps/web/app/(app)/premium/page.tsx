'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { PremiumUpgradePanel } from '@/features/premium/components/premium-upgrade-panel';
import { useTrackEvent } from '@/hooks/use-track-event';

function PremiumBoundaryBanner() {
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason');
  const cancelled = searchParams.get('cancelled');

  if (reason === 'required') {
    return (
      <div role="status" className="mb-6 rounded-md border border-insight/30 bg-insight/5 px-4 py-3 text-body-sm text-text-primary">
        That&rsquo;s a Premium feature — upgrade below to unlock it.
      </div>
    );
  }
  if (cancelled) {
    return (
      <div role="status" className="mb-6 rounded-md border border-border-subtle bg-surface px-4 py-3 text-body-sm text-text-secondary">
        Checkout was cancelled. No charge was made — you can try again anytime.
      </div>
    );
  }
  return null;
}

export default function PremiumPage() {
  useTrackEvent('premium_viewed', { feature: 'premium' });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-heading-lg text-text-primary">Premium</h1>
        <p className="mt-2 text-body-sm text-text-secondary">
          One straightforward plan — no tiers, no coupons, no surprises. Your Premium status is always decided by our
          server after a verified payment, never by anything stored in your browser.
        </p>
      </div>

      <Suspense fallback={null}>
        <PremiumBoundaryBanner />
      </Suspense>

      <PremiumUpgradePanel />
    </div>
  );
}
