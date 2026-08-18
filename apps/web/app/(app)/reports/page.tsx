import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ReportsDashboard } from '@/features/reports/components/reports-dashboard';

export const metadata: Metadata = {
  title: 'Personal Destiny Report',
  description: 'A long-form Premium report synthesizing your Natal Chart and Numerology — grounded only in your real, already-calculated facts.',
};

export default function ReportsPage() {
  return (
    <Suspense fallback={null}>
      <ReportsDashboard />
    </Suspense>
  );
}
