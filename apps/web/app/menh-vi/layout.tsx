import type { Metadata } from 'next';
import { MvBackground } from '@/features/menh-vi/components/mv-background';
import { MvTopNav } from '@/features/menh-vi/components/mv-top-nav';
import { MvSidebar } from '@/features/menh-vi/components/mv-sidebar';
import { MvMobileNav } from '@/features/menh-vi/components/mv-mobile-nav';

export const metadata: Metadata = {
  title: {
    default: 'Mệnh Vi — Không gian vận mệnh của bạn',
    template: '%s — Mệnh Vi',
  },
  description: 'Tử vi, lá số, Tarot, bản đồ sao và thần số học — hiểu bản thân mỗi ngày cùng Mệnh Vi.',
};

/**
 * Isolated design exploration, not part of the BeaconVie shell/nav — see
 * docs/design/menh-vi-reference-breakdown.md. Deliberately does not reuse (app)'s layout,
 * navigation, or design tokens.
 *
 * Desktop shell: full-width top nav, then a sidebar + main content row below it (reference
 * fidelity — see Round 2 of the reference-breakdown doc). Mobile keeps its own separate
 * composition (compact header, no sidebar, bottom tab bar).
 */
export default function MenhViLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen font-body text-mv-text">
      <MvBackground />
      <MvTopNav />
      <div className="desktop:flex">
        <MvSidebar />
        <main id="main-content" className="min-w-0 flex-1 pb-24 tablet:pb-12">
          {children}
        </main>
      </div>
      <MvMobileNav />
    </div>
  );
}
