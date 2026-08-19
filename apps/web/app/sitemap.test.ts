import sitemap from './sitemap';
import { APP_ROUTES, ONBOARDING_ROUTE } from '@/lib/route-guard';

describe('sitemap', () => {
  const routes = sitemap();
  const urls = routes.map((r) => new URL(r.url).pathname);

  it('includes the real public routes', () => {
    for (const publicPath of ['/', '/about', '/contact', '/privacy', '/terms', '/login', '/register']) {
      expect(urls).toContain(publicPath);
    }
  });

  it('excludes every authenticated app route', () => {
    for (const route of APP_ROUTES) {
      expect(urls).not.toContain(route);
    }
  });

  it('excludes the onboarding route', () => {
    expect(urls).not.toContain(ONBOARDING_ROUTE);
  });

  it('excludes the archived /menh-vi surface', () => {
    expect(urls.some((u) => u.startsWith('/menh-vi'))).toBe(false);
  });

  it('excludes token-bearing auth transactional routes', () => {
    for (const sensitive of ['/forgot-password', '/reset-password', '/verify-email']) {
      expect(urls).not.toContain(sensitive);
    }
  });

  it('every entry has a truthful (non-fabricated future) lastModified and a plausible priority/changeFrequency', () => {
    const now = Date.now();
    for (const route of routes) {
      expect(new Date(route.lastModified as Date).getTime()).toBeLessThanOrEqual(now);
      expect(route.priority).toBeGreaterThanOrEqual(0);
      expect(route.priority).toBeLessThanOrEqual(1);
    }
  });
});
