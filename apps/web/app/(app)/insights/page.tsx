import type { Metadata } from 'next';
import { Suspense } from 'react';
import { InsightDashboard } from '@/features/insight/components/insight-dashboard';

export const metadata: Metadata = { title: 'Insights' };

export default function InsightsPage() {
  return (
    <Suspense fallback={null}>
      <InsightDashboard />
    </Suspense>
  );
}
