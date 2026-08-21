import type { Metadata } from 'next';

// `page.tsx` in this directory is a client component ('use client', for useSearchParams'
// PremiumBoundaryBanner) and therefore cannot export `metadata` itself — Next.js App Router only
// allows metadata exports from Server Components. Without this layout, the page silently fell back
// to the root layout's default title ("Tử Vi Tarot — An AI Companion That Remembers You", the
// marketing tagline) instead of its own, unlike every other authenticated page (Discover, Tarot,
// Reports, etc.), which all set their own title via a direct `export const metadata` in their
// (server-component) page.tsx. `/premium/return` is unaffected — it's its own server component with
// its own more specific metadata, which still wins for that route.
export const metadata: Metadata = { title: 'Premium' };

export default function PremiumLayout({ children }: { children: React.ReactNode }) {
  return children;
}
