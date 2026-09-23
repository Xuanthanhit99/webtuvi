import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const routes = [
    { path: '', priority: 1, changeFrequency: 'weekly' as const },
    { path: '/tu-vi', priority: 0.9, changeFrequency: 'monthly' as const },
    { path: '/tarot', priority: 0.9, changeFrequency: 'monthly' as const },
    { path: '/ban-do-sao', priority: 0.9, changeFrequency: 'monthly' as const },
    { path: '/than-so-hoc', priority: 0.9, changeFrequency: 'monthly' as const },
    { path: '/about', priority: 0.5, changeFrequency: 'monthly' as const },
    { path: '/contact', priority: 0.4, changeFrequency: 'yearly' as const },
    { path: '/privacy', priority: 0.3, changeFrequency: 'yearly' as const },
    { path: '/terms', priority: 0.3, changeFrequency: 'yearly' as const },
  ];
  return routes.map(({ path, priority, changeFrequency }) => ({ url: `${baseUrl}${path}`, lastModified: new Date(), changeFrequency, priority }));
}
