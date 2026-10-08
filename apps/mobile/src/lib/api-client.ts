import { getStoredSession, setStoredSession, clearStoredSession } from './auth/session-client';

// EAS profiles set the production URL explicitly. Never use localhost in release builds.
export const API_URL = process.env.EXPO_PUBLIC_API_URL?.trim() || (__DEV__ ? 'http://localhost:4000' : 'https://api.tuvitarot.vn');
if (!__DEV__ && !API_URL.startsWith('https://')) {
  throw new Error('Mobile production API must use HTTPS.');
}

interface EnvelopeSuccess<T> {
  data: T;
  meta: Record<string, unknown>;
  requestId: string;
}

interface EnvelopeError {
  data: null;
  error: { code: string; message: string; details?: Record<string, string[]> };
  meta: Record<string, unknown>;
  requestId: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  skipRefreshRetry?: boolean;
}

// These three routes ARE the token-issuance/rotation flow itself — retrying them through the
// refresh-on-401 path below would either be meaningless (login/register aren't authenticated
// requests) or a direct infinite loop (refresh failing with 401 triggering another refresh).
const AUTH_BOOTSTRAP_ROUTES = new Set(['/auth/mobile/refresh', '/auth/mobile/login', '/auth/mobile/register']);

/**
 * `refreshed`: got a new token pair, storage updated.
 * `invalid`: the backend actually rejected the refresh token (expired/revoked/unknown) — the
 *   stored session is genuinely dead and must be cleared.
 * `network-error`: the request itself never got a response — says nothing about whether the
 *   stored credential is still valid, so it must NOT be cleared (offline ≠ logged out).
 */
type RefreshOutcome = 'refreshed' | 'invalid' | 'network-error';

let refreshPromise: Promise<RefreshOutcome> | null = null;

/**
 * Single-flight refresh, mirroring apps/web/lib/api-client.ts's `refreshSession()` — concurrent
 * 401s from multiple in-flight requests dedupe onto one `/auth/mobile/refresh` call instead of
 * each firing their own (which would race the same refresh token against reuse-detection on the
 * backend and revoke the whole session family, see auth.service.ts's refresh() docstring).
 */
async function refreshSession(): Promise<RefreshOutcome> {
  if (!refreshPromise) {
    refreshPromise = (async (): Promise<RefreshOutcome> => {
      const session = await getStoredSession();
      if (!session) return 'invalid';

      let response: Response;
      try {
        response = await fetch(`${API_URL}/auth/mobile/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: session.refreshToken }),
        });
      } catch {
        return 'network-error';
      }

      if (response.status === 401 || response.status === 403) return 'invalid';
      if (!response.ok) return 'network-error';

      const json = (await response.json().catch(() => null)) as EnvelopeSuccess<{ accessToken: string; refreshToken: string }> | null;
      if (
        !json?.data ||
        typeof json.data.accessToken !== 'string' ||
        !json.data.accessToken ||
        typeof json.data.refreshToken !== 'string' ||
        !json.data.refreshToken
      ) return 'network-error';

      await setStoredSession({ accessToken: json.data.accessToken, refreshToken: json.data.refreshToken });
      return 'refreshed';
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export async function apiFetch<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { body, headers, method, skipRefreshRetry, ...rest } = options;
  const session = await getStoredSession();

  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    method,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(session ? { Authorization: `Bearer ${session.accessToken}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401 && !skipRefreshRetry && !AUTH_BOOTSTRAP_ROUTES.has(path)) {
    const outcome = await refreshSession();
    if (outcome === 'refreshed') {
      return apiFetch<T>(path, { ...options, skipRefreshRetry: true });
    }
    if (outcome === 'invalid') {
      await clearStoredSession();
    }
    if (outcome === 'network-error') {
      // A 401 from the original call does not prove refresh token invalidity.
      // Surface a recoverable error so auth bootstrap can use its cached profile.
      throw new ApiError('Không thể xác minh phiên lúc này. Vui lòng thử lại.', 'AUTH_REFRESH_TEMPORARY', 503);
    }
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const json = (await response.json().catch(() => null)) as EnvelopeSuccess<T> | EnvelopeError | null;

  if (!response.ok || !json || 'error' in json) {
    const err = json && 'error' in json ? json.error : null;
    throw new ApiError(err?.message ?? 'Something went wrong. Please try again.', err?.code ?? 'UNKNOWN_ERROR', response.status);
  }

  return json.data;
}

export const api = {
  get: <T>(path: string, options?: ApiRequestOptions) => apiFetch<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: ApiRequestOptions) => apiFetch<T>(path, { ...options, method: 'POST', body }),
  delete: <T>(path: string, options?: ApiRequestOptions) => apiFetch<T>(path, { ...options, method: 'DELETE' }),
};
