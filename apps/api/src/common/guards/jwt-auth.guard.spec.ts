import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt-auth.guard';

const ACCESS_SECRET = 'test-access-secret';

function makeConfigMock() {
  return { get: jest.fn(() => ({ jwt: { accessSecret: ACCESS_SECRET } })) };
}

function makeContext(cookies: Record<string, string>): ExecutionContext {
  const request: { cookies: Record<string, string>; user?: unknown } = { cookies };
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('JwtAuthGuard', () => {
  const jwtService = new JwtService({});

  function signToken(payload: { sub: string; email: string }): string {
    return jwtService.sign(payload, { secret: ACCESS_SECRET });
  }

  it('rejects a request with no access token cookie', async () => {
    const prisma = { user: { findUnique: jest.fn() } };
    const guard = new JwtAuthGuard(jwtService, makeConfigMock() as never, prisma as never);

    await expect(guard.canActivate(makeContext({}))).rejects.toThrow(UnauthorizedException);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('rejects an invalid/expired token signature', async () => {
    const prisma = { user: { findUnique: jest.fn() } };
    const guard = new JwtAuthGuard(jwtService, makeConfigMock() as never, prisma as never);

    await expect(guard.canActivate(makeContext({ beaconvie_access_token: 'not-a-real-jwt' }))).rejects.toThrow(UnauthorizedException);
  });

  it('allows a valid token for an ACTIVE user', async () => {
    const token = signToken({ sub: 'user-1', email: 'user@example.com' });
    const prisma = { user: { findUnique: jest.fn(async () => ({ status: 'ACTIVE' })) } };
    const guard = new JwtAuthGuard(jwtService, makeConfigMock() as never, prisma as never);

    const context = makeContext({ beaconvie_access_token: token });
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 'user-1' }, select: { status: true } });
  });

  it('Sprint 10 — rejects a still-valid, unexpired token for a DELETED user', async () => {
    const token = signToken({ sub: 'user-1', email: 'user@example.com' });
    const prisma = { user: { findUnique: jest.fn(async () => ({ status: 'DELETED' })) } };
    const guard = new JwtAuthGuard(jwtService, makeConfigMock() as never, prisma as never);

    await expect(guard.canActivate(makeContext({ beaconvie_access_token: token }))).rejects.toThrow(UnauthorizedException);
  });

  it('rejects a token for a SUSPENDED user', async () => {
    const token = signToken({ sub: 'user-1', email: 'user@example.com' });
    const prisma = { user: { findUnique: jest.fn(async () => ({ status: 'SUSPENDED' })) } };
    const guard = new JwtAuthGuard(jwtService, makeConfigMock() as never, prisma as never);

    await expect(guard.canActivate(makeContext({ beaconvie_access_token: token }))).rejects.toThrow(UnauthorizedException);
  });

  it('rejects a token whose user no longer exists at all', async () => {
    const token = signToken({ sub: 'ghost', email: 'ghost@example.com' });
    const prisma = { user: { findUnique: jest.fn(async () => null) } };
    const guard = new JwtAuthGuard(jwtService, makeConfigMock() as never, prisma as never);

    await expect(guard.canActivate(makeContext({ beaconvie_access_token: token }))).rejects.toThrow(UnauthorizedException);
  });
});
