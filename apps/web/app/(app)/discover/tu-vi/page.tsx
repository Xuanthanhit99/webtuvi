import { TuViDashboard } from '@/features/tu-vi/components/tu-vi-dashboard';
import { createPublicSystemMetadata } from '@/components/marketing/public-system-landing';

export const metadata = createPublicSystemMetadata('tu-vi');

export default function Page() {
  return <TuViDashboard />;
}
