import { createPublicSystemMetadata, PublicSystemLanding } from '@/components/marketing/public-system-landing';
export const metadata = createPublicSystemMetadata('tarot');
export default function Page() { return <PublicSystemLanding slug="tarot" />; }
