import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AdminGuard } from './admin.guard';
import type { AuthenticatedUser } from '../decorators/current-user.decorator';

function makeContext(user: AuthenticatedUser | undefined): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

describe('AdminGuard', () => {
  const guard = new AdminGuard();

  it('allows a request with role ADMIN', () => {
    expect(guard.canActivate(makeContext({ id: 'u1', email: 'a@x.com', role: 'ADMIN' }))).toBe(true);
  });

  it('rejects a request with role USER (403, not 401 — JwtAuthGuard already authenticated it)', () => {
    expect(() => guard.canActivate(makeContext({ id: 'u1', email: 'a@x.com', role: 'USER' }))).toThrow(ForbiddenException);
  });

  it('rejects a request with no user at all (defense in depth, should never happen after JwtAuthGuard)', () => {
    expect(() => guard.canActivate(makeContext(undefined))).toThrow(ForbiddenException);
  });

  it('the thrown error carries the stable ADMIN_REQUIRED code, never a generic message', () => {
    try {
      guard.canActivate(makeContext({ id: 'u1', email: 'a@x.com', role: 'USER' }));
      fail('expected ForbiddenException');
    } catch (error) {
      expect(error).toBeInstanceOf(ForbiddenException);
      const response = (error as ForbiddenException).getResponse() as { code: string };
      expect(response.code).toBe('ADMIN_REQUIRED');
    }
  });
});
