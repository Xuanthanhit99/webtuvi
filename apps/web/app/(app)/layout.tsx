import type { Metadata } from 'next';
import { AppShell } from '@/components/layout/app-shell';

// Private pages inherit noindex; public Discovery pages explicitly override metadata.
export const metadata: Metadata = { robots: { index: false, follow: false }, alternates: { canonical: null }, openGraph: null, twitter: null };

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
