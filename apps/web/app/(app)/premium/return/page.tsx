import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PremiumReturnStatus } from '@/features/premium/components/premium-return-status';
import { AnalyticsPageView } from '@/components/analytics/analytics-page-view';

export const metadata: Metadata = {
  title: 'Confirming your payment',
};

export default function PremiumReturnPage() {
  return (
    <>
      {/* Fires on arrival regardless of the eventual payment outcome — this measures "the buyer
          completed PayOS's hosted checkout flow and came back," never payment success itself. See
          docs/architecture/product-analytics.md §"checkout_completed vs payment_success". */}
      <AnalyticsPageView event="checkout_completed" properties={{ feature: 'premium' }} />
      <Suspense fallback={null}>
        <PremiumReturnStatus />
      </Suspense>
    </>
  );
}
