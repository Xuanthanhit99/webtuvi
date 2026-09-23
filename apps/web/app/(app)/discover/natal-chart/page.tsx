import type { Metadata } from 'next';
import { Suspense } from 'react';
import { NatalChartDashboard } from '@/features/natal-chart/components/natal-chart-dashboard';

export const metadata: Metadata = {
  title: 'Bản Đồ Sao',
  description: 'Dựng bản đồ sao phương Tây từ ngày sinh, giờ sinh và địa điểm sinh để khám phá hành tinh, nhà và các góc chiếu.',
};

export default function NatalChartPage() {
  return (
    <Suspense fallback={<div className="min-h-[28rem] animate-pulse rounded-xl border border-white/10 bg-white/[0.03]" aria-label="Đang tải Bản đồ sao" />}>
      <NatalChartDashboard />
    </Suspense>
  );
}
