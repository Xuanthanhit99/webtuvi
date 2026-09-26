import { DiscoveryEntry } from '@/components/marketing/discovery-entry';
import { createPublicSystemMetadata, PublicSystemLanding } from '@/components/marketing/public-system-landing';

export const metadata = createPublicSystemMetadata('ban-do-sao');

export default function Page() {
  return <DiscoveryEntry system="ban-do-sao"><PublicSystemLanding slug="ban-do-sao" /></DiscoveryEntry>;
}
