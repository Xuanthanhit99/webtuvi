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


it.each(['/', '/discover', '/discover/tu-vi', '/discover/tarot', '/discover/natal-chart', '/discover/numerology', '/discover/eastern-horoscope'])(
  'serves public %s even with an expired cookie without calling auth', async (path) => {
    const fetch = jest.spyOn(global, 'fetch');
    const response = await middleware(new NextRequest(`https://tuvitarot.vn${path}`, {
      headers: { cookie: 'beaconvie_access_token=expired' },
    }));
    expect(response.headers.get('location')).toBeNull();
    expect(response.headers.get('x-middleware-next')).toBe('1');
    expect(fetch).not.toHaveBeenCalled();
  },
);

it.each(['', 'invalid', 'deleted', '123&item=456'])('never exposes a saved reading to an anonymous request (item=%s)', async (item) => {
  const response = await middleware(new NextRequest(`https://tuvitarot.vn/discover/tarot?item=${item}`));
  expect(new URL(response.headers.get('location')!).pathname).toBe('/login');
  expect(response.headers.get('x-robots-tag')).toBe('noindex, nofollow');
  expect(response.headers.get('cache-control')).toBe('private, no-store');
});

it('keeps authenticated saved readings private and non-indexable', async () => {
  jest.spyOn(global, 'fetch').mockResolvedValue(new Response(JSON.stringify({ data: { onboardingCompletedAt: '2026-01-01', role: 'USER' } })));
  const response = await middleware(new NextRequest('https://tuvitarot.vn/discover/tarot?item=reading-id', {
    headers: { cookie: 'beaconvie_access_token=test-token' },
  }));
  expect(response.headers.get('location')).toBeNull();
  expect(response.headers.get('x-robots-tag')).toBe('noindex, nofollow');
  expect(response.headers.get('cache-control')).toBe('private, no-store');
});


it.each(['/menh-vi', '/menh-vi/la-so', '/menh-vi/tarot', '/menh-vi/ban-do-sao', '/menh-vi/kham-pha'])('keeps archived %s out of the live product', async (path) => {
  const response = await middleware(new NextRequest(`https://tuvitarot.vn${path}`));
  expect(response.headers.get('location')).toBeNull();
  expect(response.headers.get('x-middleware-rewrite')).toBe('https://tuvitarot.vn/__archived-menh-vi-not-found__');
});
