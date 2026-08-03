import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Applied to Companion generation endpoints (see conversation.controller.ts).
 * Reuses the Sprint 2A Redis-backed throttler infrastructure (`ThrottlerModule`
 * + `RedisThrottlerStorageService`, cross-instance-safe, fails open if Redis
 * is unreachable) with two dedicated named throttlers registered in
 * `app.module.ts`: `companion` (per-user, via each throttler's own
 * `getTracker`) and `companion-ip` (per-IP, the base class default tracker) —
 * a secondary, looser ceiling so one IP spread across many accounts is still
 * bounded. Routes using this guard must also carry
 * `@SkipThrottle({ auth: true })` so the unrelated `auth` throttler's much
 * tighter login-attempt limit (see AuthThrottlerGuard) doesn't also apply to
 * Companion traffic — every named throttler in the module is otherwise
 * checked against every guarded route by default.
 *
 * Overrides `throwThrottlingException` to produce this project's normalized
 * `{code, message}` error shape (`RATE_LIMITED`) instead of the library's
 * plain-string `ThrottlerException`, matching the domain error shape used
 * elsewhere (`AI_BUDGET_EXCEEDED`, `CONVERSATION_NOT_FOUND`, ...). The
 * `Retry-After`/`X-RateLimit-*` headers are already set by the base class
 * before this is called.
 */
@Injectable()
export class CompanionThrottlerGuard extends ThrottlerGuard {
  protected override async throwThrottlingException(): Promise<void> {
    throw new HttpException(
      {
        code: 'RATE_LIMITED',
        message: "You've sent a lot of messages quickly — please wait a moment before trying again.",
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
