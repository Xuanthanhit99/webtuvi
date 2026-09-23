import type { Metadata } from 'next';
import { Suspense } from 'react';
import { TuViDashboard } from '@/features/tu-vi/components/tu-vi-dashboard';

export const metadata: Metadata = {
  title: 'Tử Vi Lá Số',
  description: 'Lập lá số Tử Vi Đẩu Số từ ngày sinh, giờ sinh và giới tính, với cung, sao và các chu kỳ vận hạn được tính theo hệ thống.',
};

export default function TuViPage() {
  return (
    <Suspense fallback={<div className="min-h-[28rem] animate-pulse rounded-xl border border-white/10 bg-white/[0.03]" aria-label="Đang tải lá số Tử Vi" />}>
      <TuViDashboard />
    </Suspense>
  );
}
