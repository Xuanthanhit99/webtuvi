import { authReturnUrl, safeNextPath } from './safe-next-path';

describe('safeNextPath', () => {
  it.each(['/', '/premium', '/discover', '/discover/tarot', '/discover/tarot?item=123', '/discover/tu-vi', '/tarot', '/ban-do-sao', '/than-so-hoc', '/settings#security'])('preserves %s', (path) => {
    expect(safeNextPath(path)).toBe(path);
  });
  it.each(['/tu-vi', '/tu-vi?source=auth', '/tu-vi#tu-vi-form'])('canonicalizes legacy Tử Vi route %s', (path) => {
    expect(safeNextPath(path)).toBe(path.replace(/^\/tu-vi/, '/discover/tu-vi'));
  });
  it.each([
    'https://example.invalid', 'http://example.invalid', '//example.invalid', '/\\example.invalid', '\\\\example.invalid',
    'javascript:alert(1)', 'data:text/html,test', '', null, undefined, 42, {},
    '/%5cexample.invalid', '/%255cexample.invalid', '/%2fexample.invalid', '/%252fexample.invalid',
    '/\n/example.invalid', '/%09/example.invalid', '/%00example.invalid', '/%zz',
    '/not-an-app', '/api/auth', '/login?next=//example.invalid', '/discover/../../login',
    '/discover/%2e%2e/%2e%2e/login',
  ])('rejects %p', (path) => expect(safeNextPath(path)).toBe('/'));

  it('propagates canonical Tử Vi intent through login and onboarding', () => {
    for (const intent of ['/tu-vi', '/discover/tu-vi']) {
      for (const route of ['/login', '/onboarding'] as const) {
        const url = new URL(authReturnUrl(route, intent), 'https://internal.invalid');
        expect(safeNextPath(url.searchParams.get('next'))).toBe('/discover/tu-vi');
        expect(authReturnUrl(route, '/\\example.invalid')).toBe(route);
      }
    }
  });
});
