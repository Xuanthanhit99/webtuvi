import type { MetadataRoute } from 'next';
import { APP_ROUTES, ONBOARDING_ROUTE } from '@/lib/route-guard';

// SEO + Shareability Foundation — audit found this list had silently drifted out of sync with
// `route-guard.ts`'s own `APP_ROUTES` (missing `/premium` and `/onboarding`, both real
// authenticated-only routes reachable by an anonymous crawler before middleware's own redirect
// would apply). Deriving from the same source `middleware.ts` already uses for the real auth gate
// means this list can never drift again — see the final report's §11.
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        ...APP_ROUTES,
        ONBOARDING_ROUTE,
        // '/menh-vi' is a Sprint 14-archived design prototype (returns 404) — excluded here too so
        // it's never crawled or indexed as a second, differently-branded public surface. Not part
        // of route-guard.ts's APP_ROUTES since it isn't an auth-gated route, it's a 404.
        '/menh-vi',
        // Reachable without auth but privacy-sensitive: forgot-password/verify-email carry a
        // one-time token in the URL and must never be indexed/cached; each also carries its own
        // page-level `robots: noindex` as defense-in-depth (see the final report's §6).
        '/forgot-password',
        '/reset-password',
        '/verify-email',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
