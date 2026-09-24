'use client';

import { AppShell } from '@/components/layout/app-shell';
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
  return (
    <AppShell maxWidthClassName="" shellMaxWidthClassName="max-w-[1536px]">
      <DashboardView />
    </AppShell>
  );
}
