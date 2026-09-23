import type { Metadata } from 'next';
import { Suspense } from 'react';
import { EasternHoroscopeDashboard } from '@/features/eastern-horoscope/components/eastern-horoscope-dashboard';

export const metadata: Metadata = {
  title: 'Ngũ Hành Phương Đông',
  description: 'Khám phá con giáp và ngũ hành từ ngày sinh theo hệ quy chiếu phương Đông, tách biệt với lá số Tử Vi Đẩu Số.',
};

export default function EasternHoroscopePage() {
  return (
    <Suspense fallback={<div className="min-h-[28rem] animate-pulse rounded-xl border border-white/10 bg-white/[0.03]" aria-label="Đang tải Ngũ Hành Phương Đông" />}>
      <EasternHoroscopeDashboard />
    </Suspense>
  );
}
