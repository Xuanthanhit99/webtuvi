import type { Metadata } from 'next';
import { Suspense } from 'react';
import { TarotDashboard } from '@/features/tarot/components/tarot-dashboard';

export const metadata: Metadata = {
  title: 'Tarot',
  description: 'Trải bài Tarot 78 lá với các lựa chọn một lá, ba lá và lá bài hôm nay; lá bài được rút theo hệ thống, không do AI tự chọn.',
};

export default function TarotPage() {
  return (
    <Suspense fallback={<div className="min-h-[28rem] animate-pulse rounded-xl border border-white/10 bg-white/[0.03]" aria-label="Đang tải Tarot" />}>
      <TarotDashboard />
    </Suspense>
  );
}
