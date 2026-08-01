import { ApiError } from './api-error';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const CSRF_COOKIE = 'beaconvie_csrf_token';
const CSRF_HEADER = 'X-CSRF-Token';
const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

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

let refreshPromise: Promise<boolean> | null = null;
let csrfBootstrapPromise: Promise<void> | null = null;

/**
 * Both the access and refresh token live only in httpOnly cookies — this client
 * never reads or stores a token itself. A 401 triggers exactly one silent
 * `/auth/refresh` attempt (deduplicated across concurrent requests) before the
 * original request is retried once.
 */
async function refreshSession(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })
      .then((res) => res.ok)
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match?.[1] !== undefined ? decodeURIComponent(match[1]) : null;
}

/**
 * The CSRF token cookie is deliberately readable (not httpOnly — see the API's
 * CsrfService/CookieService) so the client can echo it back as a header
 * (double-submit pattern). It's read fresh from the cookie on every mutating
 * request rather than cached in JS, since the server rotates it on every
 * login/register/refresh/logout — caching it would go stale the moment any of
 * those happen. `force` bypasses the "already have one" check for the one
 * retry after a CSRF_TOKEN_* rejection.
 */
async function ensureCsrfToken(force = false): Promise<string | null> {
  if (!force) {
    const existing = readCookie(CSRF_COOKIE);
    if (existing) return existing;
  }
  if (!csrfBootstrapPromise) {
    csrfBootstrapPromise = fetch(`${API_URL}/auth/csrf-token`, { credentials: 'include' })
      .then(() => undefined)
      .catch(() => undefined)
      .finally(() => {
        csrfBootstrapPromise = null;
      });
  }
  await csrfBootstrapPromise;
  return readCookie(CSRF_COOKIE);
}

export interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  skipRefreshRetry?: boolean;
  skipCsrfRetry?: boolean;
}

export async function apiFetch<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { body, skipRefreshRetry, skipCsrfRetry, headers, method, ...rest } = options;
  const upperMethod = (method ?? 'GET').toUpperCase();

  const csrfHeader: Record<string, string> = {};
  if (MUTATING_METHODS.has(upperMethod)) {
    const token = await ensureCsrfToken();
    if (token) csrfHeader[CSRF_HEADER] = token;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    method,
    credentials: 'include',
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...csrfHeader,
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401 && !skipRefreshRetry && path !== '/auth/refresh' && path !== '/auth/login') {
    const refreshed = await refreshSession();
    if (refreshed) {
      return apiFetch<T>(path, { ...options, skipRefreshRetry: true });
    }
  }

  if (response.status === 403 && !skipCsrfRetry && MUTATING_METHODS.has(upperMethod)) {
    const errorCode = await response
      .clone()
      .json()
      .then((json: EnvelopeError) => json.error?.code)
      .catch(() => null);
    if (errorCode === 'CSRF_TOKEN_MISSING' || errorCode === 'CSRF_TOKEN_INVALID') {
      await ensureCsrfToken(true);
      return apiFetch<T>(path, { ...options, skipCsrfRetry: true });
    }
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const json = (await response.json().catch(() => null)) as EnvelopeSuccess<T> | EnvelopeError | null;

  if (!response.ok || !json || 'error' in json) {
    const err = json && 'error' in json ? json.error : null;
    throw new ApiError(
      err?.message ?? 'Something went wrong. Please try again.',
      err?.code ?? 'UNKNOWN_ERROR',
      response.status,
      err?.details,
    );
  }

  return json.data;
}

export const api = {
  get: <T>(path: string, options?: ApiRequestOptions) => apiFetch<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: ApiRequestOptions) =>
    apiFetch<T>(path, { ...options, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, options?: ApiRequestOptions) =>
    apiFetch<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: ApiRequestOptions) => apiFetch<T>(path, { ...options, method: 'DELETE' }),
};
