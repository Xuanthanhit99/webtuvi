import robots from './robots';
import { APP_ROUTES, ONBOARDING_ROUTE } from '@/lib/route-guard';

describe('robots', () => {
  const result = robots();
  const disallow = Array.isArray(result.rules) ? [] : (result.rules.disallow as string[]);
  const allow = Array.isArray(result.rules) ? undefined : result.rules.allow;

  it('disallows every authenticated app route from route-guard.ts (single source of truth)', () => {
    for (const route of APP_ROUTES) {
      expect(disallow).toContain(route);
    }
  });

  it('disallows the onboarding route', () => {
    expect(disallow).toContain(ONBOARDING_ROUTE);
  });

  it('disallows the archived /menh-vi surface', () => {
    expect(disallow).toContain('/menh-vi');
  });

  it('disallows token-bearing auth transactional routes', () => {
    expect(disallow).toContain('/forgot-password');
    expect(disallow).toContain('/reset-password');
    expect(disallow).toContain('/verify-email');
  });

  it('does not block genuinely public Discovery-adjacent marketing routes', () => {
    // These are real public routes and must remain crawlable.
    for (const publicRoute of ['/about', '/contact', '/privacy', '/terms', '/login', '/register']) {
      expect(disallow).not.toContain(publicRoute);
    }
  });

  it('allows the site root', () => {
    expect(allow).toBe('/');
  });

  it('points to the sitemap', () => {
    expect(result.sitemap).toMatch(/\/sitemap\.xml$/);
  });
});
