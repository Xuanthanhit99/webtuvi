import { NextRequest, NextResponse } from 'next/server';
import { isArchivedRoute, isAdminRoute, resolveRedirect } from '@/lib/route-guard';

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

  // Sprint 14 (Ambiguity Cleanup): `/menh-vi/*` is archived from public routing (see
  // app/menh-vi/layout.tsx). A layout-level notFound() renders the correct "not found" UI but,
  // confirmed against both `next dev` and a real `next start` production build, Next.js still
  // serves it with an HTTP 200 status for these statically-generated routes — not a true 404.
  // Rewriting here, before Next's own route resolution, to a path that genuinely doesn't exist
  // makes Next's real not-found handling apply (verified to return a correct 404 for any
  // unmatched path), so `/menh-vi/*` is actually unreachable, not just visually blank.
  if (isArchivedRoute(pathname)) {
    return NextResponse.rewrite(new URL('/__archived-menh-vi-not-found__', req.url));
  }

  const hasAccessToken = req.cookies.has(ACCESS_TOKEN_COOKIE);

  const session = hasAccessToken ? await fetchMe(req.headers.get('cookie') ?? '') : null;
  const redirectTo = resolveRedirect({ pathname, hasAccessToken, session });

  if (redirectTo) {
    return NextResponse.redirect(new URL(redirectTo, req.url));
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

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/register',
    '/onboarding',
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
