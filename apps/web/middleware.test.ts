/** @jest-environment node */
import { NextRequest } from 'next/server';
import { middleware } from './middleware';

afterEach(() => jest.restoreAllMocks());

it.each(['/premium', '/discover/tarot?item=123'])('keeps %s through the unauthenticated redirect', async (path) => {
  const result = await middleware(new NextRequest(`https://app.invalid${path}`));
  const target = new URL(result.headers.get('location')!);
  expect(target.origin).toBe('https://app.invalid');
  expect(target.pathname).toBe('/login');
  expect(target.searchParams.get('next')).toBe(path);
});

it.each([
  [null, '/premium', '/onboarding'],
  ['2026-01-01', '/premium', '/premium'],
  [null, '/\\evil.invalid', '/onboarding'],
  ['2026-01-01', '/\\evil.invalid', '/'],
])('validates intent against the authenticated session (%s, %s)', async (completed, next, expected) => {
  jest.spyOn(global, 'fetch').mockResolvedValue(new Response(JSON.stringify({ data: { onboardingCompletedAt: completed, role: 'USER' } })));
  const result = await middleware(new NextRequest(`https://app.invalid/login?next=${encodeURIComponent(next!)}`, {
    headers: { cookie: 'beaconvie_access_token=test-token' },
  }));
  const target = new URL(result.headers.get('location')!);
  expect(target.origin).toBe('https://app.invalid');
  expect(target.pathname).toBe(expected);
  expect(target.searchParams.get('next')).toBe(completed === null && next === '/premium' ? '/premium' : null);
});
