import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { EntitlementService } from './entitlement.service';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';

/**
 * Server-side Premium enforcement (Phase 9 of the sprint brief) — apply after `JwtAuthGuard` on
 * any route that is exclusively Premium. Throws the normalized `PREMIUM_REQUIRED` error via
 * `EntitlementService.requirePremium` rather than a bare boolean check, so every Premium denial in
 * the app produces the identical error shape the frontend's Premium-required state expects.
 */
@Injectable()
export class PremiumGuard implements CanActivate {
  constructor(private readonly entitlementService: EntitlementService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    const user = request.user;
    if (!user) return false;
    await this.entitlementService.requirePremium(user.id);
    return true;
  }
}
