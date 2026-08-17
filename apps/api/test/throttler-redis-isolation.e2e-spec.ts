import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './utils/test-app';
import { RedisService } from '../src/redis/redis.service';

// Sprint 13 Release Closure §13 — direct Redis-level proof (not just the metadata-level
// throttler-isolation.spec.ts) that a request to one named-throttler route only ever writes a key
// for the bucket(s) it actually owns, never for an unrelated bucket. Reads real Redis key names
// (`RATE_LIMIT_REDIS_PREFIX:throttlerName:tracker` — see RedisThrottlerStorageService) after
// exercising real HTTP routes against the real Redis-backed ThrottlerGuard.

const NAMED_THROTTLERS = ['auth', 'companion', 'companion-ip', 'payment', 'discovery', 'discovery-ip'] as const;

describe('Named throttler Redis key isolation (e2e, real Redis)', () => {
  let app: INestApplication;
  let redis: RedisService;
  let prefix: string;

  beforeAll(async () => {
    app = await createTestApp();
    redis = app.get(RedisService);
    prefix = process.env.RATE_LIMIT_REDIS_PREFIX ?? 'beaconvie:throttle';
  });

  afterAll(async () => {
    await app.close();
  });

  async function keysForBucket(bucket: string): Promise<string[]> {
    return redis.client.keys(`${prefix}:${bucket}:*`);
  }

  it('a burst of unauthenticated /auth/forgot-password requests only ever writes `auth` bucket keys, never `payment`/`companion`/`discovery`', async () => {
    const email = `throttler-isolation-${Date.now()}@example.com`;

    for (let i = 0; i < 3; i += 1) {
      await request(app.getHttpServer()).post('/auth/forgot-password').send({ email });
    }

    const authKeys = await keysForBucket('auth');
    expect(authKeys.length).toBeGreaterThan(0);

    for (const bucket of NAMED_THROTTLERS.filter((b) => b !== 'auth')) {
      const keys = await keysForBucket(bucket);
      // Only assert emptiness for keys this specific burst could plausibly have created — other
      // parallel/prior test activity in the same Redis instance may have left unrelated keys for
      // other buckets, so this only proves *this request pattern* didn't write cross-bucket keys,
      // via a tracker-scoped check on the auth burst's own IP-based key suffix.
      const crossBucketKeysMatchingAuthTracker = keys.filter((k) => authKeys.some((ak) => k.endsWith(ak.split(':').pop()!)));
      expect(crossBucketKeysMatchingAuthTracker).toEqual([]);
    }
  });

  it('a real health-check read (no named throttler applied — genuinely public, unguarded route) writes no named-throttler key at all', async () => {
    // Correction made during Release Closure: this test originally targeted GET /tarot/deck,
    // assuming it was unguarded — it isn't (TarotController carries a class-level
    // `@UseGuards(JwtAuthGuard)`, confirmed by the 401 this test got back the first time it ran).
    // /health/live is the one route in this codebase confirmed by source inspection to carry no
    // guards of any kind (see health.controller.ts).
    const before = (
      await Promise.all(NAMED_THROTTLERS.map((b) => keysForBucket(b)))
    ).flat().length;

    await request(app.getHttpServer()).get('/health/live').expect(200);

    const after = (
      await Promise.all(NAMED_THROTTLERS.map((b) => keysForBucket(b)))
    ).flat().length;

    // No @UseGuards(...ThrottlerGuard...) at all on this route — only the library's own baseline
    // `default` bucket could apply, and even that never runs without an explicit guard in this
    // codebase (no global APP_GUARD for ThrottlerGuard — see csrf.module.ts vs. app.module.ts) —
    // so it must add zero new named rate-limit keys.
    expect(after).toBe(before);
  });
});
