import { ApiError } from './api-error';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

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

export interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  skipRefreshRetry?: boolean;
}

export async function apiFetch<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { body, skipRefreshRetry, headers, ...rest } = options;

  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    credentials: 'include',
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
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
};
