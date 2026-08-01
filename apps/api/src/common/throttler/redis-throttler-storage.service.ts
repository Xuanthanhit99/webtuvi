import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ThrottlerStorage } from '@nestjs/throttler';
import type { AppConfiguration } from '../../config/configuration';
import { RedisService } from '../../redis/redis.service';

// Not part of @nestjs/throttler's public export surface — shape copied from
// its throttler-storage-record.interface.ts (structurally compatible).
interface ThrottlerStorageRecord {
  totalHits: number;
  timeToExpire: number;
  isBlocked: boolean;
  timeToBlockExpire: number;
}

/**
 * Atomically increments a hit counter and, once it crosses `limit`, sets a
 * separate block marker for `blockDuration` — mirrors @nestjs/throttler's
 * built-in in-memory ThrottlerStorageService semantics exactly (see its
 * `increment()`), but as one atomic Redis operation so it's correct across
 * multiple API instances (KEYS[1]=hits key, KEYS[2]=block key).
 */
const INCREMENT_SCRIPT = `
local hitsKey = KEYS[1]
local blockKey = KEYS[2]
local ttlMs = tonumber(ARGV[1])
local limit = tonumber(ARGV[2])
local blockDurationMs = tonumber(ARGV[3])

local blockPttl = redis.call('PTTL', blockKey)
if blockPttl > 0 then
  return {0, 0, 1, blockPttl}
end

local hits = redis.call('INCR', hitsKey)
if hits == 1 then
  redis.call('PEXPIRE', hitsKey, ttlMs)
end
local pttl = redis.call('PTTL', hitsKey)
if pttl < 0 then
  redis.call('PEXPIRE', hitsKey, ttlMs)
  pttl = ttlMs
end

local isBlocked = 0
local timeToBlockExpireMs = 0
if hits > limit then
  isBlocked = 1
  local effectiveBlockMs = blockDurationMs
  if effectiveBlockMs <= 0 then
    effectiveBlockMs = pttl
  end
  redis.call('SET', blockKey, '1', 'PX', effectiveBlockMs)
  timeToBlockExpireMs = effectiveBlockMs
end

return {hits, pttl, isBlocked, timeToBlockExpireMs}
`;

/**
 * Redis-backed ThrottlerStorage so rate limits are shared across every API
 * instance (Sprint 1's default storage was per-process in-memory and reset on
 * restart / didn't work at all behind a load balancer with >1 instance).
 *
 * Fail-open by design: if Redis is unreachable, requests are allowed through
 * (with a rate-limited warning log) rather than taking the entire API down.
 * This is a deliberate availability-over-strictness trade-off for Sprint 2A —
 * see docs/security/sprint-2a-security.md "Rate limiting" for the reasoning
 * and what still protects the app during a Redis outage (Argon2 hashing cost,
 * CORS, CSRF, generic error messages).
 */
@Injectable()
export class RedisThrottlerStorageService implements ThrottlerStorage {
  private readonly logger = new Logger(RedisThrottlerStorageService.name);
  private readonly prefix: string;
  private lastFailureLogAt = 0;

  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {
    this.prefix = this.configService.get<AppConfiguration>('app')!.authRateLimit.redisPrefix;
  }

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    const hitsKey = `${this.prefix}:${throttlerName}:${key}`;
    const blockKey = `${hitsKey}:blocked`;

    try {
      const result = (await this.redisService.client.eval(
        INCREMENT_SCRIPT,
        2,
        hitsKey,
        blockKey,
        ttl,
        limit,
        blockDuration,
      )) as [number, number, number, number];

      const [totalHits, timeToExpireMs, isBlockedFlag, timeToBlockExpireMs] = result;
      return {
        totalHits,
        timeToExpire: Math.ceil(timeToExpireMs / 1000),
        isBlocked: isBlockedFlag === 1,
        timeToBlockExpire: Math.ceil(timeToBlockExpireMs / 1000),
      };
    } catch (error) {
      this.logFailureRateLimited(error);
      // Fail-open: treat as a fresh, unlimited hit rather than blocking traffic.
      return { totalHits: 0, timeToExpire: 0, isBlocked: false, timeToBlockExpire: 0 };
    }
  }

  private logFailureRateLimited(error: unknown): void {
    const now = Date.now();
    if (now - this.lastFailureLogAt < 30_000) return;
    this.lastFailureLogAt = now;
    this.logger.warn(
      `Redis rate limiter unavailable — failing open (requests will not be throttled until Redis recovers): ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}
