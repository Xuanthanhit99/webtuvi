import type { Metadata } from 'next';
import { Suspense } from 'react';
import { CompanionView } from '@/features/companion/components/companion-view';

export const metadata: Metadata = { title: 'Companion' };

export default function CompanionPage() {
  return (
    <Suspense fallback={null}>
      <CompanionView />
    </Suspense>
  );
}
