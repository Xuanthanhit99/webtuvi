import { Sidebar } from './sidebar';
import { MobileNavigation } from './mobile-navigation';
import { AppHeader } from './app-header';
import { VerifyEmailBanner } from './verify-email-banner';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh bg-canvas">
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
            longer needs that clearance, so it drops to the same pb-10 desktop already used. */}
        <main id="main-content" className="flex-1 px-4 pb-24 pt-6 tablet:px-8 tablet:pb-10">
          <div className="mx-auto w-full max-w-content">{children}</div>
        </main>
        <MobileNavigation />
      </div>
    </div>
  );
}
