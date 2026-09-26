import { NextRequest, NextResponse } from 'next/server';
import { authReturnUrl, safeNextPath } from '@/lib/safe-next-path';
import { isArchivedRoute, isAdminRoute, isPublicDiscoveryRoute, resolveRedirect } from '@/lib/route-guard';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const ACCESS_TOKEN_COOKIE = 'beaconvie_access_token';

// Interim Sprint — Admin Operator Tooling: `role` rides along on the same `/auth/me` call every
// authenticated page already makes — no second round-trip. This is a UI-gating convenience only;
// the real authorization boundary is the API's own AdminGuard (re-checked live from the DB on every
// `/admin/*` request), never this value alone.
interface MeResponse {
  data: { onboardingCompletedAt: string | null; role: 'USER' | 'ADMIN' } | null;
}

async function fetchMe(cookieHeader: string): Promise<{ onboardingCompletedAt: string | null; role: 'USER' | 'ADMIN' } | null> {
  try {
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: { cookie: cookieHeader },
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as MeResponse;
    return json.data;
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Archived prototypes are always 404, including routes with a live tool equivalent.
  if (isArchivedRoute(pathname)) {
    return NextResponse.rewrite(new URL('/__archived-menh-vi-not-found__', req.url));
  }

  const hasAccessToken = req.cookies.has(ACCESS_TOKEN_COOKIE);
  const publicDiscovery = isPublicDiscoveryRoute(pathname);
  const privateReading = publicDiscovery && req.nextUrl.searchParams.has('item');
  // Public HTML never waits for auth. Personal results still require a valid session.
  if ((pathname === '/' || publicDiscovery) && !privateReading) return NextResponse.next();

  const session = hasAccessToken ? await fetchMe(req.headers.get('cookie') ?? '') : null;
  const redirectTo = privateReading
    ? !session ? '/login' : !session.onboardingCompletedAt ? '/onboarding' : null
    : resolveRedirect({ pathname, hasAccessToken, session });

  if (redirectTo) {
    const destination = pathname === '/login' || pathname === '/register' || pathname === '/onboarding'
      ? safeNextPath(req.nextUrl.searchParams.get('next'))
      : safeNextPath(`${pathname}${req.nextUrl.search}`);
    const target = redirectTo === '/login' || redirectTo === '/onboarding'
      ? authReturnUrl(redirectTo, destination)
      : pathname === '/login' || pathname === '/register' || pathname === '/onboarding' ? destination : redirectTo;
    const response = NextResponse.redirect(new URL(target, req.url));
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    response.headers.set('Cache-Control', 'private, no-store');
    return response;
  }

  // Interim Sprint — Admin Operator Tooling: reached only once the visitor is confirmed
  // authenticated + onboarded (resolveRedirect above already handled anonymous/unonboarded
  // visitors). A non-admin gets the real Next.js not-found rendering, not a "you don't have
  // permission" page — the same rewrite-to-a-genuinely-nonexistent-path technique already proven
  // for `/menh-vi` above, so a curious authenticated user can't distinguish "this route doesn't
  // exist" from "you're not allowed here." The API's own AdminGuard is the actual security
  // boundary regardless of what this branch does.
  if (isAdminRoute(pathname) && session?.role !== 'ADMIN') {
    return NextResponse.rewrite(new URL('/__admin-not-found__', req.url));
  }

  const response = NextResponse.next();
  if (privateReading) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    response.headers.set('Cache-Control', 'private, no-store');
  }
  return response;
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/register',
    '/onboarding',
    '/dashboard',
    '/dashboard/:path*',
    '/companion/:path*',
    '/journal/:path*',
    '/discover/:path*',
    '/settings/:path*',
    // Sprint 8.5 remediation — these were previously absent, so requests to them never ran
    // through resolveRedirect() at all (see route-guard.ts's APP_ROUTES for the matching fix).
    '/memory/:path*',
    '/goals/:path*',
    '/reflections/:path*',
    '/insights/:path*',
    '/reviews/:path*',
    '/premium/:path*',
    // Sprint 16 — Personal Destiny Report.
    '/reports/:path*',
    // Sprint 14 (Ambiguity Cleanup) — archived prototype, see the handler above.
    '/menh-vi',
    '/menh-vi/:path*',
    // Interim Sprint — Admin Operator Tooling.
    '/admin',
    '/admin/:path*',
  ],
};
