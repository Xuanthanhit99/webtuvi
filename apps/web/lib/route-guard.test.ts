import { isArchivedRoute, isAdminRoute, resolveRedirect } from './route-guard';

describe('resolveRedirect (protected route behavior)', () => {
  it('redirects an unauthenticated visitor away from app routes to /login', () => {
    expect(resolveRedirect({ pathname: '/dashboard', hasAccessToken: false, session: null })).toBe('/login');
    expect(resolveRedirect({ pathname: '/onboarding', hasAccessToken: false, session: null })).toBe('/login');
  });

  it('lets an unauthenticated visitor reach marketing and auth routes', () => {
    expect(resolveRedirect({ pathname: '/', hasAccessToken: false, session: null })).toBeNull();
    expect(resolveRedirect({ pathname: '/login', hasAccessToken: false, session: null })).toBeNull();
    expect(resolveRedirect({ pathname: '/register', hasAccessToken: false, session: null })).toBeNull();
  });

  it('sends an authenticated-but-not-onboarded user from app/auth routes to /onboarding', () => {
    const session = { onboardingCompletedAt: null };
    expect(resolveRedirect({ pathname: '/dashboard', hasAccessToken: true, session })).toBe('/onboarding');
    expect(resolveRedirect({ pathname: '/login', hasAccessToken: true, session })).toBe('/onboarding');
    expect(resolveRedirect({ pathname: '/register', hasAccessToken: true, session })).toBe('/onboarding');
    expect(resolveRedirect({ pathname: '/', hasAccessToken: true, session })).toBe('/onboarding');
  });

  it('lets a not-yet-onboarded user stay on /onboarding', () => {
    const session = { onboardingCompletedAt: null };
    expect(resolveRedirect({ pathname: '/onboarding', hasAccessToken: true, session })).toBeNull();
  });

  it('sends a fully onboarded user away from /login, /register, /, and /onboarding to /dashboard', () => {
    const session = { onboardingCompletedAt: '2026-01-01T00:00:00.000Z' };
    expect(resolveRedirect({ pathname: '/login', hasAccessToken: true, session })).toBe('/dashboard');
    expect(resolveRedirect({ pathname: '/register', hasAccessToken: true, session })).toBe('/dashboard');
    expect(resolveRedirect({ pathname: '/', hasAccessToken: true, session })).toBe('/dashboard');
    expect(resolveRedirect({ pathname: '/onboarding', hasAccessToken: true, session })).toBe('/dashboard');
  });

  it('lets a fully onboarded user reach app routes normally', () => {
    const session = { onboardingCompletedAt: '2026-01-01T00:00:00.000Z' };
    expect(resolveRedirect({ pathname: '/dashboard', hasAccessToken: true, session })).toBeNull();
    expect(resolveRedirect({ pathname: '/companion', hasAccessToken: true, session })).toBeNull();
    expect(resolveRedirect({ pathname: '/settings', hasAccessToken: true, session })).toBeNull();
  });

  it('treats a present-but-invalid access-token cookie (session resolution failed) like unauthenticated for app routes, without a redirect loop on public routes', () => {
    expect(resolveRedirect({ pathname: '/dashboard', hasAccessToken: true, session: null })).toBe('/login');
    expect(resolveRedirect({ pathname: '/login', hasAccessToken: true, session: null })).toBeNull();
  });

  it('Sprint 8.5 remediation: redirects an unauthenticated visitor away from the previously-ungated app routes to /login', () => {
    for (const pathname of ['/memory', '/goals', '/reflections', '/insights', '/insights/internal', '/reviews', '/premium', '/premium/return']) {
      expect(resolveRedirect({ pathname, hasAccessToken: false, session: null })).toBe('/login');
    }
  });

  it('Sprint 8.5 remediation: lets a fully onboarded user reach the previously-ungated app routes normally', () => {
    const session = { onboardingCompletedAt: '2026-01-01T00:00:00.000Z' };
    for (const pathname of ['/memory', '/goals', '/reflections', '/insights', '/insights/internal', '/reviews', '/premium', '/premium/return']) {
      expect(resolveRedirect({ pathname, hasAccessToken: true, session })).toBeNull();
    }
  });

  it('never gates /verify-email or /verify-email/pending, regardless of auth state (no redirect loop on the verification flow)', () => {
    const onboarded = { onboardingCompletedAt: '2026-01-01T00:00:00.000Z' };
    const notOnboarded = { onboardingCompletedAt: null };

    expect(resolveRedirect({ pathname: '/verify-email', hasAccessToken: false, session: null })).toBeNull();
    expect(resolveRedirect({ pathname: '/verify-email/pending', hasAccessToken: false, session: null })).toBeNull();
    expect(resolveRedirect({ pathname: '/verify-email', hasAccessToken: true, session: notOnboarded })).toBeNull();
    expect(resolveRedirect({ pathname: '/verify-email', hasAccessToken: true, session: onboarded })).toBeNull();
    expect(resolveRedirect({ pathname: '/verify-email', hasAccessToken: true, session: null })).toBeNull();
  });
});

describe('resolveRedirect — Interim Sprint Admin Operator Tooling: /admin gets the standard auth/onboarding gate', () => {
  it('redirects an unauthenticated visitor away from /admin to /login, same as any other app route', () => {
    expect(resolveRedirect({ pathname: '/admin', hasAccessToken: false, session: null })).toBe('/login');
  });

  it('sends an authenticated-but-not-onboarded visitor from /admin to /onboarding', () => {
    expect(resolveRedirect({ pathname: '/admin', hasAccessToken: true, session: { onboardingCompletedAt: null } })).toBe('/onboarding');
  });

  it('lets a fully onboarded visitor reach /admin at the resolveRedirect layer — the role check itself is a separate, later gate (isAdminRoute + middleware.ts), not this function\'s concern', () => {
    const session = { onboardingCompletedAt: '2026-01-01T00:00:00.000Z' };
    expect(resolveRedirect({ pathname: '/admin', hasAccessToken: true, session })).toBeNull();
  });
});

describe('isAdminRoute (Interim Sprint — Admin Operator Tooling)', () => {
  it('matches the root /admin route and every sub-route', () => {
    expect(isAdminRoute('/admin')).toBe(true);
    expect(isAdminRoute('/admin/users')).toBe(true);
    expect(isAdminRoute('/admin/anything/deeply/nested')).toBe(true);
  });

  it('does not match real product routes, including ones that merely start similarly', () => {
    expect(isAdminRoute('/dashboard')).toBe(false);
    expect(isAdminRoute('/discover')).toBe(false);
    expect(isAdminRoute('/admin-something-else')).toBe(false);
  });
});

describe('isArchivedRoute (Sprint 14 — /menh-vi archival)', () => {
  it('matches the root /menh-vi route and every sub-route', () => {
    expect(isArchivedRoute('/menh-vi')).toBe(true);
    expect(isArchivedRoute('/menh-vi/la-so')).toBe(true);
    expect(isArchivedRoute('/menh-vi/tarot')).toBe(true);
    expect(isArchivedRoute('/menh-vi/anything/deeply/nested')).toBe(true);
  });

  it('does not match real product routes, including ones that merely start similarly', () => {
    expect(isArchivedRoute('/discover')).toBe(false);
    expect(isArchivedRoute('/dashboard')).toBe(false);
    expect(isArchivedRoute('/menh-vi-something-else')).toBe(false);
  });
});
