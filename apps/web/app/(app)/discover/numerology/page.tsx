import type { Metadata } from 'next';
import { Suspense } from 'react';
import { NumerologyDashboard } from '@/features/numerology/components/numerology-dashboard';

export const metadata: Metadata = {
  title: 'Numerology',
  description: 'A real, deterministic numerology calculation from your birth name and date — no number is ever chosen or invented by AI.',
};

export default function NumerologyPage() {
  return (
    <Suspense fallback={null}>
      <NumerologyDashboard />
    </Suspense>
  );
}
