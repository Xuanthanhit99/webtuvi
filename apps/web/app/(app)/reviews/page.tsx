import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ReviewDashboard } from '@/features/review/components/review-dashboard';

export const metadata: Metadata = { title: 'Reviews' };

export default function ReviewsPage() {
  return (
    <Suspense fallback={null}>
      <ReviewDashboard />
    </Suspense>
  );
}
