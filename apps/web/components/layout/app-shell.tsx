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
        <main id="main-content" className="flex-1 px-4 pb-24 pt-6 desktop:px-8 desktop:pb-10">
          <div className="mx-auto w-full max-w-content">{children}</div>
        </main>
        <MobileNavigation />
      </div>
    </div>
  );
}
