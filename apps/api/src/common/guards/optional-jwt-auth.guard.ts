import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
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

/**
 * Sprint 13 — `JwtAuthGuard`'s lenient sibling, for the one route class that must work identically
 * for signed-out and signed-in visitors: analytics ingestion (`AnalyticsController`). A landing
 * page or the register/login screens fire real events before any session exists, so this guard
 * never rejects a request for lacking a token — it only ever *adds* `request.user` when a valid,
 * still-active session is present, exactly mirroring `JwtAuthGuard`'s own token verification and
 * account-status check, just without the `throw` at every failure branch. `AnalyticsService` uses
 * `request.user?.id` to decide `distinctId = userId ?? anonymousId` (see its docstring) — an
 * invalid/expired/missing token simply means the event is recorded anonymously, never an error.
 */
@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    const token = request.cookies?.[ACCESS_TOKEN_COOKIE];
    if (!token) return true;

    const config = this.configService.get<AppConfiguration>('app')!;

    let payload: AccessTokenPayload;
    try {
      payload = this.jwtService.verify<AccessTokenPayload>(token, { secret: config.jwt.accessSecret });
    } catch {
      return true;
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub }, select: { status: true, role: true } });
    if (!user || user.status !== 'ACTIVE') {
      return true;
    }

    request.user = { id: payload.sub, email: payload.email, sessionId: payload.sid, role: user.role };
    return true;
  }
}
