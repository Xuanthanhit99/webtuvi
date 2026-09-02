'use client';

import { AppShell } from '@/components/layout/app-shell';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/providers/auth-provider';
import { DashboardView } from './dashboard-view';

/**
 * Home always renders inside the persistent sidebar shell — for authenticated users and guests
 * alike. The previous guest experience used a completely separate top-nav marketing landing page
 * (GuestHeader/GuestFooter) instead of the sidebar; that split is exactly what caused Home to
 * render as a generic public landing page rather than the approved "personal destiny space"
 * architecture. `DashboardView`/`HomeHero` still know `isGuest` for copy and data (a guest has no
 * chart/account to summarize), but the shell itself is now one architecture for every visitor.
 */
export function HomeRoute() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <main id="main-content" className="min-h-dvh bg-canvas px-4 py-6 text-[#f2eee5]">
        <div className="mx-auto flex w-full max-w-content flex-col gap-6">
          <Skeleton className="h-12 w-40 bg-white/10" />
          <Skeleton className="h-[520px] w-full rounded-[24px] bg-white/10" />
        </div>
      </main>
    );
  }

  return (
    <AppShell maxWidthClassName="" shellMaxWidthClassName="max-w-[1536px]">
      <DashboardView />
    </AppShell>
  );
}
