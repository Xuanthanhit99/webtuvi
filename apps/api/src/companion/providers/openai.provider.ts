import type { AIProvider } from './ai-provider.interface';
import {
  AIProviderError,
  type AIProviderName,
  type ChatMessage,
  type ChatOptions,
  type ChatResult,
  type StreamChunk,
  type TokenUsage,
} from './provider.types';
import { estimateTokens } from './token-estimate.util';
import { estimateCostUsd } from './pricing';

const API_URL = 'https://api.openai.com/v1/chat/completions';
const DEFAULT_MODEL = 'gpt-4o-mini';

interface OpenAIUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

/** Plain `fetch` against the OpenAI REST API — no `openai` SDK dependency. */
export class OpenAIProvider implements AIProvider {
  readonly name: AIProviderName = 'openai';

  constructor(
    private readonly apiKey: string,
    private readonly timeoutMs: number,
  ) {}

  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResult> {
    const response = await this.request(messages, { ...options, stream: false });
    const body = (await response.json()) as {
      choices: { message: { content: string } }[];
      model: string;
      usage: OpenAIUsage;
    };
    const content = body.choices[0]?.message.content ?? '';
    return { content, model: body.model, usage: toUsage(body.usage) };
  }

  async *stream(messages: ChatMessage[], options?: ChatOptions): AsyncIterable<StreamChunk> {
    const response = await this.request(messages, { ...options, stream: true });
    if (!response.body) {
      yield { type: 'error', message: 'OpenAI response had no body', retryable: true };
      return;
    }

    const model = options?.model ?? DEFAULT_MODEL;
    let full = '';
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          const data = line.slice(5).trim();
          if (data === '[DONE]') {
            const promptTokens = messages.reduce((sum, m) => sum + estimateTokens(m.content), 0);
            const completionTokens = estimateTokens(full);
            yield {
              type: 'done',
              model,
              usage: { promptTokens, completionTokens, totalTokens: promptTokens + completionTokens },
            };
            return;
          }
          const parsed = JSON.parse(data) as { choices: { delta: { content?: string } }[] };
          const token = parsed.choices[0]?.delta.content;
          if (token) {
            full += token;
            yield { type: 'token', content: token };
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  countTokens(text: string): number {
    return estimateTokens(text);
  }

  estimateCost(usage: TokenUsage, model: string): number {
    return estimateCostUsd('openai', model, usage.promptTokens, usage.completionTokens);
  }

  async health(): Promise<boolean> {
    try {
      const res = await fetch('https://api.openai.com/v1/models', {
        headers: { Authorization: `Bearer ${this.apiKey}` },
        signal: AbortSignal.timeout(5000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  supportsStreaming(): boolean {
    return true;
  }

  supportsJson(): boolean {
    return true;
  }

  supportsVision(): boolean {
    return true;
  }

  private async request(
    messages: ChatMessage[],
    options: ChatOptions & { stream: boolean },
  ): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    if (options.signal) {
      options.signal.addEventListener('abort', () => controller.abort());
    }

    let response: Response;
    try {
      response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: options.model ?? DEFAULT_MODEL,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          max_tokens: options.maxTokens,
          temperature: options.temperature,
          stream: options.stream,
        }),
        signal: controller.signal,
      });
    } catch (error) {
      // Never include the request body (conversation content) in the error message.
      const aborted = error instanceof Error && error.name === 'AbortError';
      throw new AIProviderError(aborted ? 'OpenAI request timed out' : 'OpenAI request failed', true);
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      const retryable = response.status === 429 || response.status >= 500;
      throw new AIProviderError(`OpenAI API error (${response.status})`, retryable, response.status);
    }

    return response;
  }
}

function toUsage(usage: OpenAIUsage): TokenUsage {
  return {
    promptTokens: usage.prompt_tokens,
    completionTokens: usage.completion_tokens,
    totalTokens: usage.total_tokens,
  };
}
