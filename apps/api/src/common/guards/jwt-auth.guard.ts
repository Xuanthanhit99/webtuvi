import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import type { AppConfiguration } from '../../config/configuration';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedUser } from '../decorators/current-user.decorator';
import { resolveAccessToken } from './access-token.util';

interface AccessTokenPayload {
  sub: string;
  email: string;
  sid?: string;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    const token = resolveAccessToken(request);

    if (!token) {
      throw new UnauthorizedException('Your session has expired. Please log in again.');
    }

    const config = this.configService.get<AppConfiguration>('app')!;

    let payload: AccessTokenPayload;
    try {
      payload = this.jwtService.verify<AccessTokenPayload>(token, {
        secret: config.jwt.accessSecret,
      });
    } catch {
      throw new UnauthorizedException('Your session has expired. Please log in again.');
    }

    // Sprint 10 — a still-valid, unexpired access token must not keep authenticating once the
    // account is deleted (or ever suspended). One indexed point-lookup per request; the same
    // "computed at read time, no caching" tradeoff EntitlementService.hasPremiumAccess() already
    // makes at this scale (see docs/architecture/account-data-rights.md §4).
    //
    // Interim Sprint — Admin Operator Tooling: `role` rides along on this same already-happening
    // lookup (no second query, no JWT payload change). This is what makes admin demotion take
    // effect on the very next request, with zero new revocation machinery — see
    // docs/audit/admin-operator-tooling-pre-implementation-audit.md §4/§12.
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub }, select: { status: true, role: true } });
    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Your session has expired. Please log in again.');
    }

    // A still-valid, unexpired access token must stop authenticating the moment its own session is
    // revoked (password change, logout-all, per-session revoke) — otherwise "logged out other
    // devices" is only true once that device's access token happens to expire on its own (up to
    // JWT_ACCESS_EXPIRES_IN later), not immediately as the UI promises. One indexed point-lookup by
    // primary key, same tradeoff as the user-status check above.
    if (payload.sid) {
      const session = await this.prisma.userSession.findUnique({ where: { id: payload.sid }, select: { revokedAt: true } });
      if (!session || session.revokedAt) {
        throw new UnauthorizedException('Your session has expired. Please log in again.');
      }
    }

    request.user = { id: payload.sub, email: payload.email, sessionId: payload.sid, role: user.role };
    return true;
  }
}
