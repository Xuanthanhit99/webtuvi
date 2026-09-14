import { authReturnUrl, safeNextPath } from './safe-next-path';

describe('safeNextPath', () => {
  it.each(['/', '/premium', '/discover', '/discover/tarot', '/discover/tarot?item=123', '/settings#security'])('preserves %s', (path) => {
    expect(safeNextPath(path)).toBe(path);
  });
  it.each([
    'https://example.invalid', 'http://example.invalid', '//example.invalid', '/\\example.invalid', '\\\\example.invalid',
    'javascript:alert(1)', 'data:text/html,test', '', null, undefined, 42, {},
    '/%5cexample.invalid', '/%255cexample.invalid', '/%2fexample.invalid', '/%252fexample.invalid',
    '/\n/example.invalid', '/%09/example.invalid', '/%00example.invalid', '/%zz',
    '/not-an-app', '/api/auth', '/login?next=//example.invalid', '/discover/../../login',
    '/discover/%2e%2e/%2e%2e/login',
  ])('rejects %p', (path) => expect(safeNextPath(path)).toBe('/'));

  it('propagates only safe intent through login and onboarding', () => {
    const intent = '/discover/tarot?item=123#reading';
    for (const route of ['/login', '/onboarding'] as const) {
      const url = new URL(authReturnUrl(route, intent), 'https://internal.invalid');
      expect(safeNextPath(url.searchParams.get('next'))).toBe(intent);
      expect(authReturnUrl(route, '/\\example.invalid')).toBe(route);
    }
  });
});
