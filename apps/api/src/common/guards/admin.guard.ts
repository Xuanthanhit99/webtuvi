import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../decorators/current-user.decorator';

/**
 * Interim Sprint — Admin Operator Tooling. Applies AFTER `JwtAuthGuard` on every `/admin/*` route.
 * `JwtAuthGuard` already re-reads `role` from the DB on every single request (see its own doc
 * comment) — this guard only checks the value it already resolved, never a second query and never
 * a JWT claim. That is the entire security property this sprint depends on: an ADMIN demoted to
 * USER in the database is rejected on their very next request, even with a still-valid, unexpired
 * access token, because the role check is never cached anywhere.
 *
 * See docs/audit/admin-operator-tooling-pre-implementation-audit.md §11/§12/§26 for the full
 * rationale and the alternatives (dedicated AdminUser model, environment allowlist) this design
 * was chosen over.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    const user = request.user;
    if (!user || user.role !== 'ADMIN') {
      throw new ForbiddenException({ code: 'ADMIN_REQUIRED', message: 'This action requires operator access.' });
    }
    return true;
  }
}
