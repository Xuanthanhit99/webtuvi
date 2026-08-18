// '/' is treated like an auth route for redirect purposes: docs/reference
// Module 5 §15 — a logged-in visitor should never see the marketing page again.
export const AUTH_ROUTES = ['/login', '/register', '/'];
// Sprint 8.5 remediation: this allowlist previously covered only the 5 primary-nav routes,
// leaving /memory, /goals, /reflections, /insights (+/internal), /reviews, and /premium
// (+/return) reachable by a fully logged-out visitor with no redirect — see middleware.ts's
// matcher, which must list the same routes for this allowlist to actually run against them.
export const APP_ROUTES = [
  '/dashboard',
  '/companion',
  '/journal',
  '/discover',
  '/settings',
  '/memory',
  '/goals',
  '/reflections',
  '/insights',
  '/reviews',
  '/premium',
  // Sprint 16 — Personal Destiny Report.
  '/reports',
];
export const ONBOARDING_ROUTE = '/onboarding';

// Sprint 14 (Ambiguity Cleanup) — `/menh-vi/*` is archived from public routing (see
// app/menh-vi/layout.tsx and middleware.ts). Kept as a pure, unit-testable predicate for the same
// reason resolveRedirect() is: middleware.ts can't be exercised directly without constructing a
// real NextRequest.
export function isArchivedRoute(pathname: string): boolean {
  return pathname === '/menh-vi' || pathname.startsWith('/menh-vi/');
}

export interface RouteGuardInput {
  pathname: string;
  hasAccessToken: boolean;
  /** null if there's no valid session (no cookie, or /auth/me failed). */
  session: { onboardingCompletedAt: string | null } | null;
}

/**
 * Pure route-classification logic used by middleware.ts, factored out so it's
 * unit-testable without constructing real NextRequest/NextResponse objects.
 * Returns the path to redirect to, or null to let the request through.
 */
export function resolveRedirect({ pathname, hasAccessToken, session }: RouteGuardInput): string | null {
  const isAuthRoute = AUTH_ROUTES.includes(pathname);
  const isAppRoute = APP_ROUTES.some((route) => pathname.startsWith(route));
  const isOnboardingRoute = pathname === ONBOARDING_ROUTE;

  if (!hasAccessToken || !session) {
    // Access-token cookie missing, or present but invalid/expired (session ===
    // null): don't redirect auth/marketing routes here — an invalid-but-present
    // cookie is left for the client-side AuthProvider to silently refresh,
    // avoiding a redirect loop.
    if (isAppRoute || isOnboardingRoute) return '/login';
    return null;
  }

  const onboarded = session.onboardingCompletedAt !== null;

  if (!onboarded) {
    if (isAppRoute || isAuthRoute) return '/onboarding';
    return null;
  }

  if (isOnboardingRoute || isAuthRoute) return '/dashboard';
  return null;
}
