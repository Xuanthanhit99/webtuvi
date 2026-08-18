import { NextRequest, NextResponse } from 'next/server';
import { isArchivedRoute, resolveRedirect } from '@/lib/route-guard';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const ACCESS_TOKEN_COOKIE = 'beaconvie_access_token';

interface MeResponse {
  data: { onboardingCompletedAt: string | null } | null;
}

async function fetchMe(cookieHeader: string): Promise<{ onboardingCompletedAt: string | null } | null> {
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
  ],
};
