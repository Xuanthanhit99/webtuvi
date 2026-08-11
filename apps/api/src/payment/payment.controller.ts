import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import type { PaymentOrderDto, PremiumStatusDto } from '@beaconvie/types';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PaymentThrottlerGuard } from '../common/guards/payment-throttler.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { SkipCsrf } from '../common/csrf/skip-csrf.decorator';
import type { AppConfiguration } from '../config/configuration';
import { PaymentCheckoutService } from './checkout/payment-checkout.service';
import { PaymentWebhookService } from './webhook/payment-webhook.service';
import { EntitlementService } from './entitlement/entitlement.service';

// Every named throttler in ThrottlerModule (app.module.ts) is checked against every guarded route
// by default — see PaymentThrottlerGuard's docstring, mirroring the exact isolation f8fcba1 added
// for auth vs companion. The `payment` bucket's own limit/ttl come from its registration in
// app.module.ts (config.payment.rateLimit.*) — no per-route override needed here.
const SKIP_UNRELATED_THROTTLERS = { companion: true, 'companion-ip': true, auth: true };

/**
 * Checkout/status routes sit behind `JwtAuthGuard` + the project-wide `CsrfGuard` (neither is
 * skipped — these are authenticated mutations/reads). The PayOS webhook route is the one
 * intentional exception on both counts: PayOS cannot authenticate as a BeaconVie user or supply our
 * CSRF token, so it carries `@SkipCsrf()` and no `JwtAuthGuard` — its security comes entirely from
 * `PaymentWebhookService`'s independent HMAC signature verification (Phase 6 of the sprint brief),
 * never from session/CSRF state.
 */
@ApiTags('payment')
@Controller('payment')
export class PaymentController {
  constructor(
    private readonly checkoutService: PaymentCheckoutService,
    private readonly webhookService: PaymentWebhookService,
    private readonly entitlementService: EntitlementService,
    private readonly configService: ConfigService,
  ) {}

  @Post('checkout')
  @UseGuards(JwtAuthGuard, PaymentThrottlerGuard)
  @SkipThrottle(SKIP_UNRELATED_THROTTLERS)
  @ApiOperation({ summary: 'Create a pending order and a PayOS hosted checkout link for the single Premium product' })
  createCheckout(@CurrentUser() user: AuthenticatedUser): Promise<PaymentOrderDto> {
    return this.checkoutService.createCheckout(user.id);
  }

  @Get('orders/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Poll an order’s status (owner only) — used by the post-checkout return page' })
  getOrder(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<PaymentOrderDto> {
    return this.checkoutService.getOrder(user.id, id);
  }

  @Get('premium-status')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'The caller’s current Premium entitlement status, plus the price checkout will charge' })
  async getPremiumStatus(@CurrentUser() user: AuthenticatedUser): Promise<PremiumStatusDto> {
    const summary = await this.entitlementService.getEntitlementSummary(user.id);
    const config = this.configService.get<AppConfiguration>('app')!;
    return {
      ...summary,
      priceVnd: config.payment.premium.priceVnd,
      currency: 'VND',
      // No product sign-off mechanism exists yet for this price (see
      // docs/architecture/premium-entitlements.md) — always disclosed as unvalidated until one does,
      // never inferred from NODE_ENV (that would wrongly imply production pricing is validated).
      isMvpTestPrice: true,
    };
  }

  @Post('webhooks/payos')
  @SkipCsrf()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'PayOS server-to-server payment notification — verified by HMAC signature, never by session/CSRF' })
  async handlePayOSWebhook(@Body() payload: unknown): Promise<{ received: true }> {
    await this.webhookService.handlePayOSWebhook(payload);
    return { received: true };
  }
}
