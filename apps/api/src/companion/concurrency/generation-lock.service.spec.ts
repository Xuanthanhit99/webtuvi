import { GenerationLockService } from './generation-lock.service';

function makeConfigService(maxPerUser: number, lockTtlMs = 120_000) {
  return {
    get: () => ({ ai: { concurrency: { maxPerUser, lockTtlMs } } }),
  } as unknown as import('@nestjs/config').ConfigService;
}

function makeRedis(overrides: Partial<{ incr: jest.Mock; decr: jest.Mock; del: jest.Mock; pexpire: jest.Mock }> = {}) {
  const client = {
    incr: overrides.incr ?? jest.fn().mockResolvedValue(1),
    decr: overrides.decr ?? jest.fn().mockResolvedValue(0),
    del: overrides.del ?? jest.fn().mockResolvedValue(1),
    pexpire: overrides.pexpire ?? jest.fn().mockResolvedValue(1),
  };
  return { client } as unknown as import('../../redis/redis.service').RedisService;
}

describe('GenerationLockService', () => {
  it('acquires the lock for the first concurrent generation and sets a TTL', async () => {
    const redis = makeRedis({ incr: jest.fn().mockResolvedValue(1) });
    const service = new GenerationLockService(redis, makeConfigService(1));

    expect(await service.tryAcquire('user-1')).toBe(true);
    expect(redis.client.pexpire).toHaveBeenCalledWith('companion:concurrency:user-1', 120_000);
  });

  it('rejects a second concurrent generation for the same user when the limit is 1', async () => {
    const redis = makeRedis({ incr: jest.fn().mockResolvedValue(2) });
    const service = new GenerationLockService(redis, makeConfigService(1));

    expect(await service.tryAcquire('user-1')).toBe(false);
    expect(redis.client.decr).toHaveBeenCalledWith('companion:concurrency:user-1');
  });

  it('allows a second concurrent generation when the configured limit is 2', async () => {
    const redis = makeRedis({ incr: jest.fn().mockResolvedValue(2) });
    const service = new GenerationLockService(redis, makeConfigService(2));

    expect(await service.tryAcquire('user-1')).toBe(true);
    expect(redis.client.decr).not.toHaveBeenCalled();
  });

  it('release() deletes the key once the counter returns to zero', async () => {
    const redis = makeRedis({ decr: jest.fn().mockResolvedValue(0) });
    const service = new GenerationLockService(redis, makeConfigService(1));

    await service.release('user-1');
    expect(redis.client.del).toHaveBeenCalledWith('companion:concurrency:user-1');
  });

  it('release() does not delete the key while other generations for the user are still active', async () => {
    const redis = makeRedis({ decr: jest.fn().mockResolvedValue(1) });
    const service = new GenerationLockService(redis, makeConfigService(2));

    await service.release('user-1');
    expect(redis.client.del).not.toHaveBeenCalled();
  });

  it('fails open (allows the generation) if Redis is unreachable', async () => {
    const redis = makeRedis({ incr: jest.fn().mockRejectedValue(new Error('ECONNREFUSED')) });
    const service = new GenerationLockService(redis, makeConfigService(1));

    expect(await service.tryAcquire('user-1')).toBe(true);
  });

  it('release() never throws if Redis is unreachable', async () => {
    const redis = makeRedis({ decr: jest.fn().mockRejectedValue(new Error('ECONNREFUSED')) });
    const service = new GenerationLockService(redis, makeConfigService(1));

    await expect(service.release('user-1')).resolves.toBeUndefined();
  });

  it('tracks different users independently', async () => {
    const incr = jest.fn().mockResolvedValueOnce(1).mockResolvedValueOnce(1);
    const redis = makeRedis({ incr });
    const service = new GenerationLockService(redis, makeConfigService(1));

    expect(await service.tryAcquire('user-1')).toBe(true);
    expect(await service.tryAcquire('user-2')).toBe(true);
    expect(incr).toHaveBeenNthCalledWith(1, 'companion:concurrency:user-1');
    expect(incr).toHaveBeenNthCalledWith(2, 'companion:concurrency:user-2');
  });
});
