import type { MetadataRoute } from 'next';
import { SITE_URL, isIndexingEnabled } from '@/lib/seo';
import { PUBLIC_DISCOVERY_ROUTES } from '@/lib/route-guard';

export default function sitemap(): MetadataRoute.Sitemap {
  if (!isIndexingEnabled()) return [];
  const routes = [
    { path: '', priority: 1, changeFrequency: 'weekly' as const },
    ...PUBLIC_DISCOVERY_ROUTES.map((path) => ({ path, priority: 0.9, changeFrequency: 'monthly' as const })),
    { path: '/about', priority: 0.5, changeFrequency: 'monthly' as const },
    { path: '/contact', priority: 0.4, changeFrequency: 'yearly' as const },
    { path: '/privacy', priority: 0.3, changeFrequency: 'yearly' as const },
    { path: '/terms', priority: 0.3, changeFrequency: 'yearly' as const },
  ];
  return routes.map(({ path, priority, changeFrequency }) => ({ url: `${SITE_URL}${path}`, changeFrequency, priority }));
}
