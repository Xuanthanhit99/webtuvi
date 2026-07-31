import { cookies } from 'next/headers';
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
}

/**
 * Server Component / Route Handler / middleware variant of the API client.
 * Server-to-server fetches don't automatically carry the browser's cookies, so
 * this forwards the incoming request's Cookie header explicitly.
 */
export async function apiFetchServer<T>(path: string, init?: RequestInit): Promise<T> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...init?.headers,
      cookie: cookieHeader,
    },
    cache: 'no-store',
  });

  if (response.status === 204) return undefined as T;

  const json = (await response.json().catch(() => null)) as EnvelopeSuccess<T> | EnvelopeError | null;

  if (!response.ok || !json || 'error' in json) {
    const err = json && 'error' in json ? json.error : null;
    throw new ApiError(err?.message ?? 'Something went wrong.', err?.code ?? 'UNKNOWN_ERROR', response.status);
  }

  return json.data;
}
