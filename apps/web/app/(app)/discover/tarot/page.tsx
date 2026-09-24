import { DiscoveryEntry } from '@/components/marketing/discovery-entry';
import { createPublicSystemMetadata, PublicSystemLanding } from '@/components/marketing/public-system-landing';

export const metadata = createPublicSystemMetadata('tarot');

export default function Page() {
  return <DiscoveryEntry system="tarot"><PublicSystemLanding slug="tarot" /></DiscoveryEntry>;
}
