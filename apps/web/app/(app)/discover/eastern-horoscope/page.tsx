import type { Metadata } from 'next';
import { Suspense } from 'react';
import { EasternHoroscopeDashboard } from '@/features/eastern-horoscope/components/eastern-horoscope-dashboard';

export const metadata: Metadata = {
  title: 'Ngũ Hành Phương Đông',
  description: 'A real, deterministic Chinese Zodiac and Five Elements calculation from your birth date — no sign or element is ever chosen or invented by AI.',
};

export default function EasternHoroscopePage() {
  return (
    <Suspense fallback={null}>
      <EasternHoroscopeDashboard />
    </Suspense>
  );
}
