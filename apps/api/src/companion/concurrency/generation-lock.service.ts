import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppConfiguration } from '../../config/configuration';
import { RedisService } from '../../redis/redis.service';

const KEY_PREFIX = 'companion:concurrency';

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
    const config = this.configService.get<AppConfiguration>('app')!.ai.concurrency;
    const key = `${KEY_PREFIX}:${userId}`;

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

  async release(userId: string): Promise<void> {
    const key = `${KEY_PREFIX}:${userId}`;
    try {
      const remaining = await this.redis.client.decr(key);
      if (remaining <= 0) {
        await this.redis.client.del(key);
      }
    } catch (error) {
      // Best-effort — the TTL set in tryAcquire() self-heals a missed release.
      this.logger.warn(
        `Redis unavailable while releasing a concurrency lock — the TTL will self-heal it: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
