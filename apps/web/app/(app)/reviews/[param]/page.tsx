import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ReviewParamRouter } from '@/features/review/components/review-param-router';

export const metadata: Metadata = { title: 'Review' };

export default async function ReviewParamPage({ params }: { params: Promise<{ param: string }> }) {
  const { param } = await params;
  return (
    <Suspense fallback={null}>
      <ReviewParamRouter param={param} />
    </Suspense>
  );
}
