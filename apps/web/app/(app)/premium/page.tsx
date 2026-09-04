'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowDown, CircleCheck, Info } from 'lucide-react';
import { PremiumUpgradePanel } from '@/features/premium/components/premium-upgrade-panel';
import { useTrackEvent } from '@/hooks/use-track-event';

function PremiumBoundaryBanner() {
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason');
  const cancelled = searchParams.get('cancelled');

  if (reason === 'required') {
    return <div role="status" className="flex items-start gap-3 rounded-lg border border-[#d5ad62]/25 bg-[#d5ad62]/[0.07] px-4 py-3 text-body-sm text-text-primary"><Info className="mt-0.5 h-4 w-4 shrink-0 text-[#e6c980]" aria-hidden="true" /><p>Tính năng bạn vừa chọn thuộc Premium. Xem quyền lợi và mức giá hiện tại bên dưới.</p></div>;
  }
  if (cancelled) {
    return <div role="status" className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-body-sm text-text-secondary"><CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-trust" aria-hidden="true" /><p>Bạn đã rời trang thanh toán. Không có khoản thanh toán nào được xác nhận; bạn có thể thử lại khi sẵn sàng.</p></div>;
  }
  return null;
}

export default function PremiumPage() {
  useTrackEvent('premium_viewed', { feature: 'premium' });
  return (
    <main className="flex flex-col gap-7 pb-12">
      <header className="relative isolate overflow-hidden rounded-xl border border-[#d5ad62]/20 bg-[#080d18] px-5 py-7 tablet:px-9 tablet:py-9 desktop:px-12">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_88%_12%,rgba(213,173,98,0.14),transparent_26%),radial-gradient(circle_at_70%_92%,rgba(112,140,121,0.09),transparent_30%),linear-gradient(135deg,#080d18,#0c1220)]" />
        <div className="pointer-events-none absolute right-[8%] top-1/2 -z-10 hidden h-52 w-52 -translate-y-1/2 rounded-full border border-[#d5ad62]/10 tablet:block" />
        <div className="max-w-3xl">
          <p className="text-caption font-semibold uppercase tracking-[0.24em] text-[#d5ad62]">Mệnh Vi Premium</p>
          <h1 className="mt-3 font-display text-heading-lg leading-tight text-text-primary tablet:text-display-sm">Đi sâu hơn vào hành trình hiểu mình</h1>
          <p className="mt-4 max-w-2xl text-body-md leading-relaxed text-text-secondary">Một gói Premium 30 ngày, thanh toán một lần. Mở rộng giới hạn Tarot, nhận luận giải sâu hơn và lưu toàn bộ lịch sử đọc.</p>
          <a href="#goi-premium" className="mt-5 inline-flex min-h-11 items-center gap-2 text-body-sm font-semibold text-[#e6c980] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d5ad62]">Xem gói và mức giá <ArrowDown className="h-4 w-4" aria-hidden="true" /></a>
        </div>
      </header>
      <Suspense fallback={null}><PremiumBoundaryBanner /></Suspense>
      <PremiumUpgradePanel />
    </main>
  );
}
