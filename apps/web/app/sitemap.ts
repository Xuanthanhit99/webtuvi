import type { MetadataRoute } from 'next';
import { SITE_URL, isIndexingEnabled } from '@/lib/seo';
import { PUBLIC_DISCOVERY_ROUTES } from '@/lib/route-guard';
import { ARTICLES, CLUSTERS } from '@/features/knowledge/content';
import { TAROT_CARD_SEO_PATH, TAROT_SEO_UPDATED_AT, tarotSeoCards } from '@/features/knowledge/tarot-cards';

export default function sitemap(): MetadataRoute.Sitemap {
  if (!isIndexingEnabled()) return [];
  const routes = [
    { path: '', priority: 1, changeFrequency: 'weekly' as const },
    ...PUBLIC_DISCOVERY_ROUTES.map((path) => ({ path, priority: 0.9, changeFrequency: 'monthly' as const })),
    { path: '/kien-thuc', priority: 0.8, changeFrequency: 'weekly' as const },
    ...Object.keys(CLUSTERS).map((cluster) => ({ path: `/kien-thuc/${cluster}`, priority: 0.75, changeFrequency: 'weekly' as const })),
    ...ARTICLES.map((article) => ({ path: `/kien-thuc/${article.cluster}/${article.slug}`, priority: 0.7, changeFrequency: 'monthly' as const, lastModified: new Date(`${article.updatedAt}T00:00:00+07:00`) })),
    ...tarotSeoCards.map((card) => ({ path: `${TAROT_CARD_SEO_PATH}/${card.slug}`, priority: 0.65, changeFrequency: 'monthly' as const, lastModified: new Date(TAROT_SEO_UPDATED_AT) })),
    { path: '/about', priority: 0.5, changeFrequency: 'monthly' as const },
    { path: '/contact', priority: 0.4, changeFrequency: 'yearly' as const },
    { path: '/privacy', priority: 0.3, changeFrequency: 'yearly' as const },
    { path: '/terms', priority: 0.3, changeFrequency: 'yearly' as const },
  ];
  return routes.map(({ path, priority, changeFrequency, ...rest }) => ({ url: `${SITE_URL}${path}`, changeFrequency, priority, ...rest }));
}
