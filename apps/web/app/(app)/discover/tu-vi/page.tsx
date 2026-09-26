import { DiscoveryEntry } from '@/components/marketing/discovery-entry';
import { createPublicSystemMetadata, PublicSystemLanding } from '@/components/marketing/public-system-landing';

export const metadata = createPublicSystemMetadata('tu-vi');

export default function Page() {
  return <DiscoveryEntry system="tu-vi"><PublicSystemLanding slug="tu-vi" /></DiscoveryEntry>;
}
