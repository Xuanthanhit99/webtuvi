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

const API_URL = 'https://api.anthropic.com/v1/messages';
const API_VERSION = '2023-06-01';
// Sprint 12 pricing sanity check — claude-3-5-sonnet-20241022 no longer appears anywhere on
// Anthropic's official pricing page (platform.claude.com/docs/en/about-claude/pricing, fetched
// live), not even in its "retired" tier (which only lists back to Opus 4/Sonnet 4/Haiku 3.5) —
// strong evidence the model id itself is fully sunset, not just superseded. Current default per
// the same source: Claude Sonnet 5 ($2/$10 per MTok). See pricing.ts for the matching cost entry.
const DEFAULT_MODEL = 'claude-sonnet-5';
const DEFAULT_MAX_TOKENS = 1024;

/** Plain `fetch` against the Anthropic Messages API — no SDK dependency. */
export class AnthropicProvider implements AIProvider {
  readonly name: AIProviderName = 'anthropic';

  constructor(
    private readonly apiKey: string,
    private readonly timeoutMs: number,
  ) {}

  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResult> {
    const response = await this.request(messages, { ...options, stream: false });
    const body = (await response.json()) as {
      content: { type: string; text: string }[];
      model: string;
      usage: { input_tokens: number; output_tokens: number };
    };
    const content = body.content.find((block) => block.type === 'text')?.text ?? '';
    const usage: TokenUsage = {
      promptTokens: body.usage.input_tokens,
      completionTokens: body.usage.output_tokens,
      totalTokens: body.usage.input_tokens + body.usage.output_tokens,
    };
    return { content, model: body.model, usage };
  }

  async *stream(messages: ChatMessage[], options?: ChatOptions): AsyncIterable<StreamChunk> {
    const response = await this.request(messages, { ...options, stream: true });
    if (!response.body) {
      yield { type: 'error', message: 'Anthropic response had no body', retryable: true };
      return;
    }

    const model = options?.model ?? DEFAULT_MODEL;
    let promptTokens = 0;
    let completionTokens = 0;
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
          if (!data) continue;

          const parsed = JSON.parse(data) as {
            type: string;
            delta?: { type?: string; text?: string; stop_reason?: string };
            message?: { usage?: { input_tokens: number } };
            usage?: { output_tokens: number };
          };

          if (parsed.type === 'message_start' && parsed.message?.usage) {
            promptTokens = parsed.message.usage.input_tokens;
          } else if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
            yield { type: 'token', content: parsed.delta.text };
          } else if (parsed.type === 'message_delta' && parsed.usage) {
            completionTokens = parsed.usage.output_tokens;
          } else if (parsed.type === 'message_stop') {
            yield {
              type: 'done',
              model,
              usage: { promptTokens, completionTokens, totalTokens: promptTokens + completionTokens },
            };
            return;
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
    return estimateCostUsd('anthropic', model, usage.promptTokens, usage.completionTokens);
  }

  supportsStreaming(): boolean {
    return true;
  }

  supportsJson(): boolean {
    return false;
  }

  supportsVision(): boolean {
    return true;
  }

  private headers(): Record<string, string> {
    return {
      'x-api-key': this.apiKey,
      'anthropic-version': API_VERSION,
      'Content-Type': 'application/json',
    };
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

    // Anthropic separates the system prompt from the message list.
    const systemPrompt = messages.find((m) => m.role === 'system')?.content;
    const conversation = messages.filter((m) => m.role !== 'system').map((m) => ({ role: m.role, content: m.content }));

    let response: Response;
    try {
      response = await fetch(API_URL, {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({
          model: options.model ?? DEFAULT_MODEL,
          max_tokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
          temperature: options.temperature,
          system: systemPrompt,
          messages: conversation,
          stream: options.stream,
        }),
        signal: controller.signal,
      });
    } catch (error) {
      const aborted = error instanceof Error && error.name === 'AbortError';
      throw new AIProviderError(aborted ? 'Anthropic request timed out' : 'Anthropic request failed', true);
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      const retryable = response.status === 429 || response.status >= 500;
      throw new AIProviderError(`Anthropic API error (${response.status})`, retryable, response.status);
    }

    return response;
  }
}
