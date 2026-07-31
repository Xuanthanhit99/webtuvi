import { NextRequest, NextResponse } from 'next/server';
import { resolveRedirect } from '@/lib/route-guard';

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
  ],
};
