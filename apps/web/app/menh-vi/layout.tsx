import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Sprint 14 (Ambiguity Cleanup): archived from public routing per
 * docs/product/product-completion-roadmap-v2.md Sprint 14 and the founder decision recorded in
 * docs/audit/full-product-completion-roadmap-rebase.md §47 — BeaconVie is the sole canonical
 * production brand, and `/menh-vi/*` must not act as a second public front door.
 *
 * This was an isolated design exploration, never part of the BeaconVie shell/nav (see
 * docs/design/menh-vi-reference-breakdown.md). The route tree and its components under
 * apps/web/features/menh-vi are intentionally preserved, unmodified, for reuse — only public
 * reachability is removed, via a hard 404 at the layout level so every nested route inherits it.
 */
export default function MenhViLayout({ children: _children }: { children: React.ReactNode }) {
  notFound();
}
