import { Sidebar } from './sidebar';
import { MobileNavigation } from './mobile-navigation';
import { AppHeader } from './app-header';
import { VerifyEmailBanner } from './verify-email-banner';
import { cn } from '@/lib/cn';

export function AppShell({
  children,
  maxWidthClassName = 'max-w-content',
  shellMaxWidthClassName,
}: {
  children: React.ReactNode;
  /** Every `(app)/*` page shares the sitewide `max-w-content` (1240px) cap on the content
      *inside* main by default. Home passes '' (no inner cap) because it uses
      `shellMaxWidthClassName` instead — capping the whole sidebar+main row is what actually
      bounds Home's width on large monitors; a separate inner cap would just double up. */
  maxWidthClassName?: string;
  /** Caps and centers the entire shell (sidebar + main together), leaving the dark canvas
      background visible outside it — e.g. on a 32"/4K monitor. Undefined by default so every
      other `(app)/*` page keeps its existing edge-to-edge sidebar/full-width behavior unchanged;
      Home passes 'max-w-[1536px]' to freeze its own growth past that width. */
  shellMaxWidthClassName?: string;
}) {
  return (
    <div className="min-h-dvh bg-canvas">
      <div className={cn('mx-auto flex min-h-dvh', shellMaxWidthClassName)}>
        <Sidebar />
        {/* Sprint 18B.12 final pre-live QA: `min-w-0` is required here — this div is a flex item of
            the row above, and flex items default to `min-width: auto`, meaning a sufficiently wide
            descendant (e.g. PremiumMatrix's `min-w-[420px]` comparison table, which correctly manages
            its own horizontal scroll via `overflow-x-auto`) would otherwise refuse to let this column
            shrink to the viewport, forcing the entire page wider than the viewport instead of letting
            the descendant scroll within its own box. Reproduced live at 375px on `/premium` (79px of
            page-level horizontal overflow) before this fix; confirmed gone after. */}
        <div className="flex min-h-dvh min-w-0 flex-1 flex-col">
          <AppHeader />
          <VerifyEmailBanner />
          {/* Accessibility + Product Polish (2026-08-19): pb-24 clears MobileNavigation's fixed
              bottom bar, which is now phone-only (<768px, see mobile-navigation.tsx) — tablet no
              longer needs that clearance, so it drops to the same pb-10 desktop already used.
              Mobile safe-area audit (2026-08-28): the flat 96px (`pb-24`) didn't add
              `env(safe-area-inset-bottom)` on top of itself — on a device with a home-indicator
              inset that ate directly into the "comfortable spacing" margin below the nav instead
              of the reserved space growing with it. Now explicit: nav's own ~57px content height
              + the device inset + 40px of real breathing room, so page content (including the
              Home footer) is never tucked behind the nav on any device. */}
          <main id="main-content" className="flex-1 px-4 pb-[calc(57px+env(safe-area-inset-bottom)+40px)] pt-6 tablet:px-8 tablet:pb-10">
            <div className={cn('mx-auto w-full', maxWidthClassName)}>{children}</div>
          </main>
          <MobileNavigation />
        </div>
      </div>
    </div>
  );
}
