import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Authenticated app surfaces — nothing behind the login wall should ever be crawled.
      // '/menh-vi' is a Sprint 14-archived design prototype (returns 404) — excluded here too so
      // it's never crawled or indexed as a second, differently-branded public surface.
      // '/admin' (Interim Sprint — Admin Operator Tooling) must never become an acquisition
      // surface — no public CTA links to it anywhere, and it 404s for non-admins regardless.
      disallow: ['/dashboard', '/companion', '/journal', '/memory', '/reflections', '/insights', '/reviews', '/goals', '/discover', '/settings', '/menh-vi', '/reports', '/admin'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
