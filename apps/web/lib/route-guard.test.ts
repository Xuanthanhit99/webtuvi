import { resolveRedirect } from './route-guard';

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
});
