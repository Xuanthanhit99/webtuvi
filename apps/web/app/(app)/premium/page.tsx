'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { PremiumUpgradePanel } from '@/features/premium/components/premium-upgrade-panel';
import { useTrackEvent } from '@/hooks/use-track-event';
import { MvPage, MvPageHeader } from '@/components/ui/mv-page';

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
    <MvPage>
      <MvPageHeader
        eyebrow="Tử Vi Tarot+"
        title="Mở khóa chiều sâu, không làm ồn trải nghiệm"
        description="Một gói 30 ngày rõ ràng. Trạng thái Premium luôn được đọc từ backend sau thanh toán đã xác minh, không quyết định bằng dữ liệu trong trình duyệt."
      />

      <Suspense fallback={null}>
        <PremiumBoundaryBanner />
      </Suspense>

      <PremiumUpgradePanel />
    </MvPage>
  );
}
