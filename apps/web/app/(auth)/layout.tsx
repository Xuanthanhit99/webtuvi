import type { Metadata } from 'next';

export const metadata: Metadata = { robots: { index: false, follow: false }, alternates: { canonical: null }, openGraph: null, twitter: null, referrer: 'no-referrer' };

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div id="main-content">{children}</div>;
}
