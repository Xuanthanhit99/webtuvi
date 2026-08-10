import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Applied to checkout/order-creation endpoints (see payment.controller.ts). Reuses the same
 * Redis-backed throttler infrastructure as `CompanionThrottlerGuard`/`AuthThrottlerGuard`, with its
 * own named `payment` bucket registered in `app.module.ts`, per-authenticated-user (tracked via
 * `getTracker`). Routes using this guard must also carry
 * `@SkipThrottle({ companion: true, 'companion-ip': true, auth: true })` — mirroring the exact
 * isolation `f8fcba1` added for `auth` after discovering every named throttler in the module applies
 * to every guarded route by default, not just the one(s) a route names in its own `@Throttle()`.
 * The public webhook route deliberately does NOT use this guard — see PaymentController docstring.
 */
@Injectable()
export class PaymentThrottlerGuard extends ThrottlerGuard {
  protected override async throwThrottlingException(): Promise<void> {
    throw new HttpException(
      {
        code: 'RATE_LIMITED',
        message: "You've made a lot of checkout attempts quickly — please wait a moment before trying again.",
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
