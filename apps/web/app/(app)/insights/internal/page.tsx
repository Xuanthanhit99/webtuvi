import type { Metadata } from 'next';
import { Suspense } from 'react';
import { InsightHome } from '@/features/insight/components/insight-home';

export const metadata: Metadata = { title: 'Insight Preparation (internal)' };

export default function InsightsInternalPage() {
  return (
    <Suspense fallback={null}>
      <InsightHome />
    </Suspense>
  );
}
