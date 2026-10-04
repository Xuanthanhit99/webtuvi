import { Suspense } from 'react';

import { createPublicSystemMetadata } from '@/components/marketing/public-system-landing';
import { TuViDashboard } from '@/features/tu-vi/components/tu-vi-dashboard';

export const metadata = createPublicSystemMetadata('tu-vi');

export default function Page() {
  return (
    <Suspense fallback={null}>
      <TuViDashboard />
    </Suspense>
  );
}
