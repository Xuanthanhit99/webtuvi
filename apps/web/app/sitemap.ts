import type { MetadataRoute } from 'next';

/** Phase 8 — only real, public, indexable routes. Authenticated app routes (dashboard, companion,
 * journal, memory, reflections, insights, reviews, goals, tarot readings) are deliberately
 * excluded — nothing to index behind a login wall. */
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
