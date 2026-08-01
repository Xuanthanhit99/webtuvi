// Runs once before the whole e2e suite (Jest globalSetup — plain JS/CommonJS,
// not passed through ts-jest). Flushes any rate-limiter keys left over from a
// previous local run: the Redis-backed throttler (Sprint 2A) persists across
// process restarts by design (that's the point — see RedisThrottlerStorageService),
// but that means repeated local `test:e2e` runs against the same Redis would
// otherwise accumulate hits against the same IP-keyed bucket and start
// returning 429 on register/login calls that have nothing to do with the
// rate-limiting tests themselves.
const { config } = require('dotenv');
const path = require('path');

config({ path: path.resolve(__dirname, '../.env.test') });

module.exports = async () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Redis = require('ioredis');
  const prefix = process.env.RATE_LIMIT_REDIS_PREFIX || 'beaconvie:throttle';
  const redis = new Redis(process.env.REDIS_URL);
  try {
    const keys = await redis.keys(`${prefix}:*`);
    if (keys.length > 0) {
      await redis.del(keys);
    }
  } finally {
    await redis.quit();
  }
};
