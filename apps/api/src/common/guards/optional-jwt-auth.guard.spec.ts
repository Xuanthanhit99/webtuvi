import { ExecutionContext } from '@nestjs/common';
import { OptionalJwtAuthGuard } from './optional-jwt-auth.guard';

function makeContext(cookies: Record<string, string>): { context: ExecutionContext; request: Record<string, unknown> } {
  const request: Record<string, unknown> = { cookies };
  const context = {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
  return { context, request };
}

describe('OptionalJwtAuthGuard (Sprint 13 Release Closure §22 — deleted/inactive account cannot authenticate analytics)', () => {
  const SECRET = 'a'.repeat(32);
  const config = { get: jest.fn().mockReturnValue({ jwt: { accessSecret: SECRET } }) };

  function makeGuard(prismaUser: { status: string } | null) {
    const jwtService = { verify: jest.fn().mockReturnValue({ sub: 'user-1', email: 'user@example.com', sid: 'sess-1' }) };
    const prisma = { user: { findUnique: jest.fn().mockResolvedValue(prismaUser) } };
    const guard = new OptionalJwtAuthGuard(jwtService as never, config as never, prisma as never);
    return { guard, jwtService, prisma };
  }

  it('never rejects — always returns true, even with no token at all', async () => {
    const { guard } = makeGuard(null);
    const { context, request } = makeContext({});
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user).toBeUndefined();
  });

  it('populates request.user for a valid token belonging to an ACTIVE account', async () => {
    const { guard } = makeGuard({ status: 'ACTIVE' });
    const { context, request } = makeContext({ beaconvie_access_token: 'valid-token' });
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user).toEqual({ id: 'user-1', email: 'user@example.com', sessionId: 'sess-1' });
  });

  it('does NOT populate request.user for a token belonging to a DELETED account — the exact scenario a deleted account replaying an old cookie represents', async () => {
    const { guard } = makeGuard({ status: 'DELETED' });
    const { context, request } = makeContext({ beaconvie_access_token: 'stale-token-of-deleted-user' });
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user).toBeUndefined();
  });

  it('does NOT populate request.user when the account no longer exists at all', async () => {
    const { guard } = makeGuard(null);
    const { context, request } = makeContext({ beaconvie_access_token: 'token-for-nonexistent-user' });
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user).toBeUndefined();
  });

  it('does NOT populate request.user when the token fails signature verification', async () => {
    const jwtService = { verify: jest.fn().mockImplementation(() => { throw new Error('invalid signature'); }) };
    const prisma = { user: { findUnique: jest.fn() } };
    const guard = new OptionalJwtAuthGuard(jwtService as never, config as never, prisma as never);
    const { context, request } = makeContext({ beaconvie_access_token: 'tampered-token' });
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user).toBeUndefined();
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });
});
