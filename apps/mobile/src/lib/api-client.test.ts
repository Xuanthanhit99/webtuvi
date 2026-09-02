import { apiFetch, ApiError } from './api-client';
import * as sessionClient from './auth/session-client';

jest.mock('./auth/session-client');

const mockedSessionClient = sessionClient as jest.Mocked<typeof sessionClient>;

function envelope(data: unknown) {
  return { data, meta: {}, requestId: 'test' };
}

function errorEnvelope(code: string, message = 'error') {
  return { data: null, error: { code, message }, meta: {}, requestId: 'test' };
}

function jsonResponse(status: number, body: unknown) {
  return Promise.resolve({
    status,
    ok: status >= 200 && status < 300,
    json: () => Promise.resolve(body),
  } as unknown as Response);
}

describe('apiFetch', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    global.fetch = jest.fn();
  });

  it('sends no Authorization header when there is no stored session', async () => {
    mockedSessionClient.getStoredSession.mockResolvedValue(null);
    (global.fetch as jest.Mock).mockReturnValue(jsonResponse(200, envelope({ ok: true })));

    await apiFetch('/dashboard');

    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.headers.Authorization).toBeUndefined();
  });

  it('attaches Authorization: Bearer <accessToken> when a session is stored', async () => {
    mockedSessionClient.getStoredSession.mockResolvedValue({ accessToken: 'access-1', refreshToken: 'refresh-1' });
    (global.fetch as jest.Mock).mockReturnValue(jsonResponse(200, envelope({ ok: true })));

    await apiFetch('/dashboard');

    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.headers.Authorization).toBe('Bearer access-1');
  });

  it('on a 401, refreshes once and retries the original request exactly once', async () => {
    mockedSessionClient.getStoredSession.mockResolvedValue({ accessToken: 'expired', refreshToken: 'refresh-1' });
    mockedSessionClient.setStoredSession.mockResolvedValue(undefined);

    (global.fetch as jest.Mock)
      .mockReturnValueOnce(jsonResponse(401, errorEnvelope('SESSION_EXPIRED'))) // original request
      .mockReturnValueOnce(jsonResponse(200, envelope({ accessToken: 'new-access', refreshToken: 'new-refresh' }))) // /auth/mobile/refresh
      .mockReturnValueOnce(jsonResponse(200, envelope({ ok: true }))); // retried original request

    const result = await apiFetch('/dashboard');

    expect(result).toEqual({ ok: true });
    expect(global.fetch).toHaveBeenCalledTimes(3);
    expect((global.fetch as jest.Mock).mock.calls[1][0]).toContain('/auth/mobile/refresh');
    expect(mockedSessionClient.setStoredSession).toHaveBeenCalledWith({ accessToken: 'new-access', refreshToken: 'new-refresh' });
  });

  it('dedupes concurrent 401s into a single /auth/mobile/refresh call (single-flight)', async () => {
    mockedSessionClient.getStoredSession.mockResolvedValue({ accessToken: 'expired', refreshToken: 'refresh-1' });
    mockedSessionClient.setStoredSession.mockResolvedValue(undefined);

    const hitCounts: Record<string, number> = {};
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      hitCounts[url] = (hitCounts[url] ?? 0) + 1;
      if (url.includes('/auth/mobile/refresh')) {
        return jsonResponse(200, envelope({ accessToken: 'new-access', refreshToken: 'new-refresh' }));
      }
      const isFirstHit = hitCounts[url] === 1;
      return isFirstHit ? jsonResponse(401, errorEnvelope('SESSION_EXPIRED')) : jsonResponse(200, envelope({ ok: true }));
    });

    await Promise.all([apiFetch('/a'), apiFetch('/b')]);

    const refreshHits = Object.entries(hitCounts).filter(([url]) => url.includes('/auth/mobile/refresh'));
    expect(refreshHits).toHaveLength(1);
    expect(refreshHits[0][1]).toBe(1);
  });

  it('clears the stored session when the refresh request itself is rejected (invalid credential)', async () => {
    mockedSessionClient.getStoredSession.mockResolvedValue({ accessToken: 'expired', refreshToken: 'revoked' });

    (global.fetch as jest.Mock)
      .mockReturnValueOnce(jsonResponse(401, errorEnvelope('SESSION_EXPIRED'))) // original
      .mockReturnValueOnce(jsonResponse(401, errorEnvelope('SESSION_EXPIRED'))); // refresh itself rejected

    await expect(apiFetch('/dashboard')).rejects.toThrow(ApiError);
    expect(mockedSessionClient.clearStoredSession).toHaveBeenCalledTimes(1);
  });

  it('does NOT clear the stored session when the refresh attempt fails from a network error', async () => {
    mockedSessionClient.getStoredSession.mockResolvedValue({ accessToken: 'expired', refreshToken: 'still-maybe-valid' });

    (global.fetch as jest.Mock)
      .mockReturnValueOnce(jsonResponse(401, errorEnvelope('SESSION_EXPIRED'))) // original
      .mockRejectedValueOnce(new Error('network unreachable')); // refresh attempt itself throws

    await expect(apiFetch('/dashboard')).rejects.toThrow(ApiError);
    expect(mockedSessionClient.clearStoredSession).not.toHaveBeenCalled();
  });

  it('does not attempt a refresh when /auth/mobile/refresh itself returns 401 (no infinite loop)', async () => {
    mockedSessionClient.getStoredSession.mockResolvedValue({ accessToken: 'x', refreshToken: 'y' });
    (global.fetch as jest.Mock).mockReturnValue(jsonResponse(401, errorEnvelope('SESSION_EXPIRED')));

    await expect(apiFetch('/auth/mobile/refresh', { method: 'POST', body: { refreshToken: 'y' } })).rejects.toThrow(ApiError);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
