import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Applied to the AI-generating Discovery endpoints (Tarot/Numerology/Natal Chart's `:id/interpret`
 * retry routes — the confirmed abuse vector, Sprint 12 audit §30). Reuses the same Redis-backed
 * throttler infrastructure as `CompanionThrottlerGuard`/`PaymentThrottlerGuard`, with its own named
 * `discovery`/`discovery-ip` buckets registered in `app.module.ts`, shared across all three
 * Discovery surfaces (one bucket, not three) since they carry the same abuse profile and cost
 * shape — feature-level distinction lives in `AIUsage`/`ProviderLog` attribution instead, not in
 * separate rate-limit buckets. Routes using this guard must also carry
 * `@SkipThrottle({ auth: true, companion: true, 'companion-ip': true, payment: true })` — mirroring
 * the exact isolation `f8fcba1` added for `auth` after discovering every named throttler in the
 * module applies to every guarded route by default, not just the one(s) a route names in its own
 * `@Throttle()`.
 */
@Injectable()
export class DiscoveryThrottlerGuard extends ThrottlerGuard {
  protected override async throwThrottlingException(): Promise<void> {
    throw new HttpException(
      {
        code: 'RATE_LIMITED',
        message: "You've requested a lot of interpretations quickly — please wait a moment before trying again.",
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
