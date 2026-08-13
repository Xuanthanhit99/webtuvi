import type { Metadata } from 'next';
import { Suspense } from 'react';
import { NatalChartDashboard } from '@/features/natal-chart/components/natal-chart-dashboard';

export const metadata: Metadata = {
  title: 'Natal Chart',
  description: 'A real, deterministic birth chart calculated from your birth date, time, and place — no placement is ever chosen or invented by AI.',
};

export default function NatalChartPage() {
  return (
    <Suspense fallback={null}>
      <NatalChartDashboard />
    </Suspense>
  );
}
