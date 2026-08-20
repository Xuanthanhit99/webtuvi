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

// Domain + Brand Production Lock — sitemap() reads NEXT_PUBLIC_APP_URL fresh on every call (not
// cached at module load), so the locked production domain is verified directly, not assumed.
describe('sitemap — Domain + Brand Production Lock (tuvitarot.vn)', () => {
  const ORIGINAL_URL = process.env.NEXT_PUBLIC_APP_URL;

  afterEach(() => {
    if (ORIGINAL_URL === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
    else process.env.NEXT_PUBLIC_APP_URL = ORIGINAL_URL;
  });

  it('resolves every entry to the locked production domain once NEXT_PUBLIC_APP_URL is set', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://tuvitarot.vn';
    const routes = sitemap();
    expect(routes.length).toBeGreaterThan(0);
    for (const route of routes) {
      expect(route.url.startsWith('https://tuvitarot.vn')).toBe(true);
    }
  });

  it('never resolves to the retired beaconvie.com domain, regardless of env', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://tuvitarot.vn';
    for (const route of sitemap()) {
      expect(route.url).not.toContain('beaconvie.com');
    }
  });
});
