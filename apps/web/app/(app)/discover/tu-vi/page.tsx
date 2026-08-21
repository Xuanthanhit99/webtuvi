import type { Metadata } from 'next';
import { Suspense } from 'react';
import { TuViDashboard } from '@/features/tu-vi/components/tu-vi-dashboard';

export const metadata: Metadata = {
  title: 'Tử Vi Lá Số',
  description: 'A real, deterministic Vietnamese Tử Vi Đẩu Số chart calculated from your birth date, time, and sex — no palace or star is ever chosen or invented by AI.',
};

export default function TuViPage() {
  return (
    <Suspense fallback={null}>
      <TuViDashboard />
    </Suspense>
  );
}
