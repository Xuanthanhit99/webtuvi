import type { MetadataRoute } from 'next';

/** Phase 8 — only real, public, indexable routes. Authenticated app routes (dashboard, companion,
 * journal, memory, reflections, insights, reviews, goals, tarot readings) are deliberately
 * excluded — nothing to index behind a login wall.
 *
 * SEO + Shareability Foundation note: `/discover` and every Discovery system route
 * (`/discover/tarot`, `/discover/numerology`, `/discover/natal-chart`,
 * `/discover/eastern-horoscope`) are intentionally absent too — they live entirely under the
 * authenticated `(app)` route group (confirmed by reading the actual route tree, not assumed) and
 * are correctly `noindex`'d and disallowed for that reason. There is currently no public,
 * logged-out entry point for any Discovery system to add here. Building one is a real product
 * decision (how much of each system to reveal pre-login, interactive-teaser vs. static copy,
 * conversion-funnel impact) — out of scope for this foundation pass; see the final report's
 * Stop-Condition-H finding. */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const routes = ['', '/about', '/contact', '/privacy', '/terms', '/login', '/register'];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'weekly' : 'monthly',
    priority: route === '' ? 1 : 0.5,
  }));
}
