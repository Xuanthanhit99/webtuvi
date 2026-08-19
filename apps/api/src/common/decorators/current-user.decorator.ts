import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { UserRole } from '@prisma/client';

export interface AuthenticatedUser {
  id: string;
  email: string;
  /** Absent for access tokens issued before Sprint 2A — those users regain a
   * sessionId on their next login/refresh. See AuthService.issueTokens. */
  sessionId?: string;
  /** Interim Sprint — Admin Operator Tooling. Read live from the DB by JwtAuthGuard on every
   * request (never from the JWT itself, which carries no role claim) — see AdminGuard, which is the
   * only consumer that should ever branch on this. */
  role: UserRole;
}

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
  const request = ctx.switchToHttp().getRequest<Request & { user: AuthenticatedUser }>();
  return request.user;
});
