import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CsrfGuard } from './csrf.guard';
import { CSRF_TOKEN_COOKIE, CSRF_HEADER } from './csrf.constants';

function makeContext(opts: { method?: string; cookies?: Record<string, string>; headers?: Record<string, string> }): ExecutionContext {
  const request = {
    method: opts.method ?? 'POST',
    cookies: opts.cookies ?? {},
    headers: opts.headers ?? {},
  };
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => undefined,
    getClass: () => undefined,
  } as unknown as ExecutionContext;
}

function makeGuard(reflectorOverride: Reflector, verifyResult = true) {
  const csrfService = { verifyToken: jest.fn(() => verifyResult) };
  return { guard: new CsrfGuard(reflectorOverride, csrfService as never), csrfService };
}

describe('CsrfGuard', () => {
  it('skips safe methods (GET/HEAD/OPTIONS) without checking tokens', () => {
    const reflector = { getAllAndOverride: jest.fn() } as unknown as Reflector;
    const { guard } = makeGuard(reflector);
    expect(guard.canActivate(makeContext({ method: 'GET' }))).toBe(true);
    expect(reflector.getAllAndOverride).not.toHaveBeenCalled();
  });

  it('skips routes decorated with @SkipCsrf()', () => {
    const reflector = { getAllAndOverride: jest.fn(() => true) } as unknown as Reflector;
    const { guard } = makeGuard(reflector);
    expect(guard.canActivate(makeContext({ method: 'POST' }))).toBe(true);
  });

  it('rejects a mutating request with no CSRF cookie/header at all', () => {
    const reflector = { getAllAndOverride: jest.fn(() => false) } as unknown as Reflector;
    const { guard } = makeGuard(reflector);
    expect(() => guard.canActivate(makeContext({ method: 'POST' }))).toThrow(ForbiddenException);
  });

  it('rejects when the cookie and header values do not match', () => {
    const reflector = { getAllAndOverride: jest.fn(() => false) } as unknown as Reflector;
    const { guard } = makeGuard(reflector);
    const context = makeContext({
      method: 'POST',
      cookies: { [CSRF_TOKEN_COOKIE]: 'token-a' },
      headers: { [CSRF_HEADER]: 'token-b' },
    });
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('accepts a matching, HMAC-valid cookie+header pair on a mutating request', () => {
    const reflector = { getAllAndOverride: jest.fn(() => false) } as unknown as Reflector;
    const { guard } = makeGuard(reflector, true);
    const context = makeContext({
      method: 'POST',
      cookies: { [CSRF_TOKEN_COOKIE]: 'same-token' },
      headers: { [CSRF_HEADER]: 'same-token' },
    });
    expect(guard.canActivate(context)).toBe(true);
  });

  describe('Phase 02 — Bearer-authenticated requests skip CSRF', () => {
    it('skips CSRF entirely when an Authorization: Bearer header is present, even with no CSRF cookie/header', () => {
      const reflector = { getAllAndOverride: jest.fn(() => false) } as unknown as Reflector;
      const { guard } = makeGuard(reflector);
      const context = makeContext({ method: 'POST', headers: { authorization: 'Bearer some-access-token' } });
      expect(guard.canActivate(context)).toBe(true);
    });

    it('still enforces CSRF for a cookie-only mutating request with no Authorization header — web behavior unchanged', () => {
      const reflector = { getAllAndOverride: jest.fn(() => false) } as unknown as Reflector;
      const { guard } = makeGuard(reflector);
      expect(() => guard.canActivate(makeContext({ method: 'POST' }))).toThrow(ForbiddenException);
    });

    it('does not skip on a non-Bearer Authorization header', () => {
      const reflector = { getAllAndOverride: jest.fn(() => false) } as unknown as Reflector;
      const { guard } = makeGuard(reflector);
      const context = makeContext({ method: 'POST', headers: { authorization: 'Basic dXNlcjpwYXNz' } });
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });
  });
});
