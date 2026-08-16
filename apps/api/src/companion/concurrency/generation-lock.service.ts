import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppConfiguration } from '../../config/configuration';
import { RedisService } from '../../redis/redis.service';
import type { DiscoveryAIFeature } from '../providers/ai-feature.types';

const COMPANION_KEY_PREFIX = 'companion:concurrency';
const DISCOVERY_KEY_PREFIX = 'discovery:concurrency';

/**
 * Caps how many generations one user can have in flight at once
 * (`AI_MAX_CONCURRENT_GENERATIONS_PER_USER`, default 1), enforced with a
 * plain Redis `INCR`/`DECR` counter — atomic, so it's correct across every API
 * instance, not just the process that received this request.
 *
 * `tryAcquire`/`release` are meant to bracket exactly one `StreamService.generate()`
 * call in a `try`/`finally`, so the counter is decremented on every exit path
 * (success, provider error, cancellation, client disconnect, timeout) without
 * StreamService needing to know anything about how the lock works.
 *
 * The counter key gets a TTL the moment it's first incremented (not
 * refreshed thereafter) as a safety net: if a release is ever missed (a crash
 * between acquire and the `finally`), the key — and therefore the lock —
 * self-expires after `AI_CONCURRENCY_LOCK_TTL_MS` rather than permanently
 * blocking that user. `release()` deletes the key outright once the count
 * reaches zero so a long-idle user doesn't leave a stray zero-value key
 * around forever.
 *
 * Fails open on a Redis error, consistent with `RedisThrottlerStorageService`'s
 * documented Sprint 2A trade-off: an unreachable Redis degrades availability
 * protections rather than taking Companion down entirely.
 */
@Injectable()
export class GenerationLockService {
  private readonly logger = new Logger('CompanionConcurrency');

  constructor(
    private readonly redis: RedisService,
    private readonly configService: ConfigService,
  ) {}

  async tryAcquire(userId: string): Promise<boolean> {
    return this.tryAcquireKey(`${COMPANION_KEY_PREFIX}:${userId}`);
  }

  async release(userId: string): Promise<void> {
    return this.releaseKey(`${COMPANION_KEY_PREFIX}:${userId}`);
  }

  /**
   * Sprint 12 — Discovery AI parity (Tarot/Numerology/Natal Chart). Scoped per
   * `(feature, user, reading)` rather than per-user-globally like Companion's own lock above: two
   * concurrent interpret retries against the SAME reading are blocked (the confirmed abuse vector
   * — Sprint 12 audit §30), but Tarot/Numerology/Natal Chart never block each other, and two
   * different readings of the same feature never block each other either. A lock as broad as
   * Companion's (one global slot per user across every AI surface) would be unnecessarily
   * restrictive here — Discovery has no live-chat UX where "only one generation in flight at a
   * time" is a meaningful product constraint the way it is for Companion. Reuses the exact same
   * `AI_MAX_CONCURRENT_GENERATIONS_PER_USER`/`AI_CONCURRENCY_LOCK_TTL_MS` config (same fail-open/
   * TTL-self-heal semantics) since the mechanism is identical, just a different key namespace. See
   * docs/architecture/discovery-ai-cost-control.md "Concurrency lock".
   */
  async tryAcquireDiscovery(feature: DiscoveryAIFeature, userId: string, sourceId: string): Promise<boolean> {
    return this.tryAcquireKey(`${DISCOVERY_KEY_PREFIX}:${feature}:${userId}:${sourceId}`);
  }

  async releaseDiscovery(feature: DiscoveryAIFeature, userId: string, sourceId: string): Promise<void> {
    return this.releaseKey(`${DISCOVERY_KEY_PREFIX}:${feature}:${userId}:${sourceId}`);
  }

  private async tryAcquireKey(key: string): Promise<boolean> {
    const config = this.configService.get<AppConfiguration>('app')!.ai.concurrency;

    try {
      const count = await this.redis.client.incr(key);
      if (count === 1) {
        await this.redis.client.pexpire(key, config.lockTtlMs);
      }
      if (count > config.maxPerUser) {
        await this.redis.client.decr(key);
        return false;
      }
      return true;
    } catch (error) {
      this.logger.warn(
        `Redis unavailable for concurrency lock — failing open (allowing the generation): ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return true;
    }
  }

  private async releaseKey(key: string): Promise<void> {
    try {
      const remaining = await this.redis.client.decr(key);
      if (remaining <= 0) {
        await this.redis.client.del(key);
      }
    } catch (error) {
      // Best-effort — the TTL set in tryAcquireKey() self-heals a missed release.
      this.logger.warn(
        `Redis unavailable while releasing a concurrency lock — the TTL will self-heal it: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
