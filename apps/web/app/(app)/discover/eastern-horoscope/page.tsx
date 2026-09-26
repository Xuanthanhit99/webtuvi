import { DiscoveryEntry } from '@/components/marketing/discovery-entry';
import { createPublicSystemMetadata, PublicSystemLanding } from '@/components/marketing/public-system-landing';

export const metadata = createPublicSystemMetadata('eastern-horoscope');

export default function Page() {
  return <DiscoveryEntry system="eastern-horoscope"><PublicSystemLanding slug="eastern-horoscope" /></DiscoveryEntry>;
}
