import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PremiumReturnStatus } from '@/features/premium/components/premium-return-status';

export const metadata: Metadata = {
  title: 'Confirming your payment',
};

export default function PremiumReturnPage() {
  return (
    <Suspense fallback={null}>
      <PremiumReturnStatus />
    </Suspense>
  );
}
