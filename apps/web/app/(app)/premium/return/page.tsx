import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PremiumReturnStatus } from '@/features/premium/components/premium-return-status';
import { AnalyticsPageView } from '@/components/analytics/analytics-page-view';

export const metadata: Metadata = {
  title: 'Xác nhận thanh toán',
  robots: { index: false, follow: false },
};

export default function PremiumReturnPage() {
  return (
    <main className="flex min-h-[calc(100vh-10rem)] items-center justify-center py-6 tablet:py-10">
      {/* Fires on arrival regardless of the eventual payment outcome — this measures "the buyer
          completed PayOS's hosted checkout flow and came back," never payment success itself. See
          docs/architecture/product-analytics.md §"checkout_completed vs payment_success". */}
      <AnalyticsPageView event="checkout_completed" properties={{ feature: 'premium' }} />
      <Suspense fallback={<div className="h-80 w-full max-w-lg animate-pulse rounded-xl border border-white/10 bg-surface" />}>
        <PremiumReturnStatus />
      </Suspense>
    </main>
  );
}
