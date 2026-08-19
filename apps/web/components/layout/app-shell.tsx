import { Sidebar } from './sidebar';
import { MobileNavigation } from './mobile-navigation';
import { AppHeader } from './app-header';
import { VerifyEmailBanner } from './verify-email-banner';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh bg-canvas">
      <Sidebar />
      <div className="flex min-h-dvh flex-1 flex-col">
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
