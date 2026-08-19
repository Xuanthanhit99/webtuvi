import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Applied to every `/admin/*` route. Its own named `admin` bucket (app.module.ts), per-
 * authenticated-user tracked — mirrors `discovery`/`payment`/`companion`'s isolation exactly. Routes
 * using this guard must also carry `@SkipThrottle({ auth: true, companion: true, 'companion-ip':
 * true, payment: true, discovery: true, 'discovery-ip': true })`, the same f8fcba1 isolation every
 * other named-bucket guard in this codebase requires (every named throttler applies to every
 * guarded route by default). Deliberately not the loose `default` bucket (1000/min, sized for a
 * public audience) — admin is a handful of named accounts, and this bucket exists to bound a
 * compromised-or-scripted admin session, not to gate normal interactive support work.
 */
@Injectable()
export class AdminThrottlerGuard extends ThrottlerGuard {
  protected override async throwThrottlingException(): Promise<void> {
    throw new HttpException(
      { code: 'RATE_LIMITED', message: "You've made a lot of operator requests quickly — please wait a moment before trying again." },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
