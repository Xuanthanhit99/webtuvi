import { DiscoveryEntry } from '@/components/marketing/discovery-entry';
import { createPublicSystemMetadata, PublicSystemLanding } from '@/components/marketing/public-system-landing';

export const metadata = createPublicSystemMetadata('than-so-hoc');

export default function Page() {
  return <DiscoveryEntry system="than-so-hoc"><PublicSystemLanding slug="than-so-hoc" /></DiscoveryEntry>;
}
