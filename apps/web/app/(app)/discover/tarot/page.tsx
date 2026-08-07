import type { Metadata } from 'next';
import { Suspense } from 'react';
import { TarotDashboard } from '@/features/tarot/components/tarot-dashboard';

export const metadata: Metadata = {
  title: 'Tarot',
  description: 'A real, deterministic 78-card Tarot draw — no card is ever chosen or invented by AI.',
};

export default function TarotPage() {
  return (
    <Suspense fallback={null}>
      <TarotDashboard />
    </Suspense>
  );
}
