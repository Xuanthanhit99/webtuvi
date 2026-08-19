import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import type { AppConfiguration } from '../../config/configuration';
import { ACCESS_TOKEN_COOKIE } from '../../auth/cookie.service';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedUser } from '../decorators/current-user.decorator';

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
    const token = request.cookies?.[ACCESS_TOKEN_COOKIE];

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

    request.user = { id: payload.sub, email: payload.email, sessionId: payload.sid, role: user.role };
    return true;
  }
}
