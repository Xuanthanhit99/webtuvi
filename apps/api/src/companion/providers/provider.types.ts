export type AIProviderName = 'openai' | 'anthropic' | 'gemini' | 'mock';

export type ChatRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  /** Aborts an in-flight request — wired to SSE client-disconnect for cancel. */
  signal?: AbortSignal;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface ChatResult {
  content: string;
  model: string;
  usage: TokenUsage;
}

/**
 * `code` is a normalized, stable identifier for the frontend/observability to
 * key off of (never the raw provider error string) — e.g. `PROVIDER_UNAVAILABLE`
 * when the whole fallback chain is exhausted, `GENERATION_INTERRUPTED` when a
 * mid-stream failure ends a turn without falling back, `CONCURRENT_GENERATION`
 * when a second generation for the same user is rejected. Optional because not
 * every error chunk needs one today; add new codes here as they're needed.
 */
export type StreamChunk =
  | { type: 'token'; content: string }
  | { type: 'done'; usage: TokenUsage; model: string }
  | { type: 'error'; message: string; retryable: boolean; code?: string };

/**
 * Thrown by a provider implementation on any failed request. `retryable`
 * drives RetryPolicy (429/5xx/timeout = retryable; 4xx auth/validation
 * errors = not). Never carries the request/response body — see
 * docs/security/ai-safety.md "Observability".
 */
export class AIProviderError extends Error {
  constructor(
    message: string,
    public readonly retryable: boolean,
    public readonly statusCode?: number,
  ) {
    super(message);
    this.name = 'AIProviderError';
  }
}
