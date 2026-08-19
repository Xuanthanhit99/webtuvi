import type { Metadata } from 'next';
import { AppShell } from '@/components/layout/app-shell';

// SEO + Shareability Foundation — defense-in-depth: every route under this authenticated group
// (dashboard, discover, reports, settings, admin, ...) is already blocked in robots.ts, but that
// alone is a convention a crawler can ignore. This applies `noindex,follow` at the metadata level
// to the entire group in one place; child pages inherit it automatically unless they set their own
// `robots` value (Next.js metadata resolution: a field a child page doesn't define is inherited
// from its layout). `/admin`'s own page already set this explicitly before this change — identical
// value, no conflict.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
