import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Authenticated app surfaces — nothing behind the login wall should ever be crawled.
      disallow: ['/dashboard', '/companion', '/journal', '/memory', '/reflections', '/insights', '/reviews', '/goals', '/discover', '/settings'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
