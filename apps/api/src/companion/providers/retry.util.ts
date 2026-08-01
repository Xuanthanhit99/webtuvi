import { AIProviderError } from './provider.types';

export interface RetryOptions {
  maxRetries: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Exponential backoff with jitter: baseDelay * 2^attempt, capped at
 * maxDelayMs, +/-20% jitter to avoid a thundering herd if many requests
 * retry at once. Only retries `AIProviderError`s marked `retryable` (429,
 * 5xx, timeout — set by each provider implementation); anything else
 * (validation errors, 4xx auth failures) fails immediately.
 */
export async function withRetry<T>(fn: (attempt: number) => Promise<T>, options: RetryOptions): Promise<T> {
  const { maxRetries, baseDelayMs = 500, maxDelayMs = 8000 } = options;
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      return await fn(attempt);
    } catch (error) {
      lastError = error;
      const retryable = error instanceof AIProviderError ? error.retryable : false;
      if (!retryable || attempt === maxRetries) {
        throw error;
      }
      const exponential = Math.min(baseDelayMs * 2 ** attempt, maxDelayMs);
      const jitter = exponential * (0.8 + Math.random() * 0.4);
      await delay(jitter);
    }
  }

  // Unreachable (loop always returns or throws), satisfies the compiler.
  throw lastError;
}
