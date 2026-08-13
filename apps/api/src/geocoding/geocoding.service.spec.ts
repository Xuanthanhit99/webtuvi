import { GeocodingService } from './geocoding.service';
import { GeocodingUnavailableError } from './geocoding-provider.interface';

function makeRedisMock() {
  const store = new Map<string, string>();
  return {
    client: {
      set: jest.fn(async (key: string, value: string) => {
        store.set(key, value);
        return 'OK';
      }),
      get: jest.fn(async (key: string) => store.get(key) ?? null),
    },
    __store: store,
  };
}

function makeConfigMock(candidateTtlSeconds = 900) {
  return { get: jest.fn().mockReturnValue({ geocoding: { candidateTtlSeconds } }) };
}

describe('GeocodingService', () => {
  it('caches each search candidate under an opaque token and returns only the token + label — never raw coordinates', async () => {
    const provider = {
      search: jest.fn().mockResolvedValue([
        { label: 'Hà Nội, Vietnam', latitude: 21.0285, longitude: 105.8542, countryCode: 'VN' },
        { label: 'Hanoi, New York, USA', latitude: 42.9, longitude: -76.9, countryCode: 'US' },
      ]),
    };
    const redis = makeRedisMock();
    const service = new GeocodingService(provider as never, redis as never, makeConfigMock() as never);

    const results = await service.search('Hanoi');

    expect(results).toHaveLength(2);
    for (const result of results) {
      expect(typeof result.token).toBe('string');
      expect(result.token.length).toBeGreaterThan(0);
      expect(result).not.toHaveProperty('latitude');
      expect(result).not.toHaveProperty('longitude');
    }
    expect(results[0]!.label).toBe('Hà Nội, Vietnam');
    expect(redis.client.set).toHaveBeenCalledTimes(2);
    expect(redis.client.set).toHaveBeenCalledWith(expect.stringContaining(results[0]!.token), expect.any(String), 'EX', 900);
  });

  it('resolve() returns the exact cached candidate for a valid token', async () => {
    const provider = { search: jest.fn().mockResolvedValue([{ label: 'Đà Nẵng, Vietnam', latitude: 16.0544, longitude: 108.2022, countryCode: 'VN' }]) };
    const redis = makeRedisMock();
    const service = new GeocodingService(provider as never, redis as never, makeConfigMock() as never);

    const [result] = await service.search('Da Nang');
    const resolved = await service.resolve(result!.token);

    expect(resolved).toEqual({ label: 'Đà Nẵng, Vietnam', latitude: 16.0544, longitude: 108.2022, countryCode: 'VN' });
  });

  it('resolve() returns null for an unknown/expired token — never fabricates coordinates', async () => {
    const redis = makeRedisMock();
    const service = new GeocodingService({ search: jest.fn() } as never, redis as never, makeConfigMock() as never);

    expect(await service.resolve('not-a-real-token')).toBeNull();
  });

  it('search() returns an empty array for a blank query without calling the provider', async () => {
    const provider = { search: jest.fn() };
    const redis = makeRedisMock();
    const service = new GeocodingService(provider as never, redis as never, makeConfigMock() as never);

    expect(await service.search('   ')).toEqual([]);
    expect(provider.search).not.toHaveBeenCalled();
  });

  it('bounds the query length before it reaches the provider', async () => {
    const provider = { search: jest.fn().mockResolvedValue([]) };
    const redis = makeRedisMock();
    const service = new GeocodingService(provider as never, redis as never, makeConfigMock() as never);

    const longQuery = 'a'.repeat(500);
    await service.search(longQuery);

    expect(provider.search).toHaveBeenCalledWith('a'.repeat(200));
  });

  it('propagates GeocodingUnavailableError from the provider rather than swallowing it into an empty result', async () => {
    const provider = { search: jest.fn().mockRejectedValue(new GeocodingUnavailableError('down')) };
    const redis = makeRedisMock();
    const service = new GeocodingService(provider as never, redis as never, makeConfigMock() as never);

    await expect(service.search('Hanoi')).rejects.toThrow(GeocodingUnavailableError);
  });
});
