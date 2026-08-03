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

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_MODEL = 'gemini-1.5-flash';

interface GeminiUsage {
  promptTokenCount: number;
  candidatesTokenCount: number;
  totalTokenCount: number;
}

/** Plain `fetch` against the Google Generative Language API — no SDK dependency. */
export class GeminiProvider implements AIProvider {
  readonly name: AIProviderName = 'gemini';

  constructor(
    private readonly apiKey: string,
    private readonly timeoutMs: number,
  ) {}

  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResult> {
    const model = options?.model ?? DEFAULT_MODEL;
    const response = await this.request(model, messages, options, false);
    const body = (await response.json()) as {
      candidates: { content: { parts: { text: string }[] } }[];
      usageMetadata: GeminiUsage;
    };
    const content = body.candidates[0]?.content.parts.map((p) => p.text).join('') ?? '';
    return { content, model, usage: toUsage(body.usageMetadata) };
  }

  async *stream(messages: ChatMessage[], options?: ChatOptions): AsyncIterable<StreamChunk> {
    const model = options?.model ?? DEFAULT_MODEL;
    const response = await this.request(model, messages, options, true);
    if (!response.body) {
      yield { type: 'error', message: 'Gemini response had no body', retryable: true };
      return;
    }

    let lastUsage: GeminiUsage | undefined;
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
            candidates?: { content?: { parts?: { text: string }[] } }[];
            usageMetadata?: GeminiUsage;
          };
          const text = parsed.candidates?.[0]?.content?.parts?.map((p) => p.text).join('');
          if (text) yield { type: 'token', content: text };
          if (parsed.usageMetadata) lastUsage = parsed.usageMetadata;
        }
      }
    } finally {
      reader.releaseLock();
    }

    yield {
      type: 'done',
      model,
      usage: lastUsage ? toUsage(lastUsage) : { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
    };
  }

  countTokens(text: string): number {
    return estimateTokens(text);
  }

  estimateCost(usage: TokenUsage, model: string): number {
    return estimateCostUsd('gemini', model, usage.promptTokens, usage.completionTokens);
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
    model: string,
    messages: ChatMessage[],
    options: ChatOptions | undefined,
    stream: boolean,
  ): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    if (options?.signal) {
      options.signal.addEventListener('abort', () => controller.abort());
    }

    const systemPrompt = messages.find((m) => m.role === 'system')?.content;
    const contents = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));

    const endpoint = stream
      ? `${API_BASE}/${model}:streamGenerateContent?alt=sse&key=${this.apiKey}`
      : `${API_BASE}/${model}:generateContent?key=${this.apiKey}`;

    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          systemInstruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined,
          generationConfig: {
            maxOutputTokens: options?.maxTokens,
            temperature: options?.temperature,
          },
        }),
        signal: controller.signal,
      });
    } catch (error) {
      const aborted = error instanceof Error && error.name === 'AbortError';
      throw new AIProviderError(aborted ? 'Gemini request timed out' : 'Gemini request failed', true);
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      const retryable = response.status === 429 || response.status >= 500;
      throw new AIProviderError(`Gemini API error (${response.status})`, retryable, response.status);
    }

    return response;
  }
}

function toUsage(usage: GeminiUsage): TokenUsage {
  return {
    promptTokens: usage.promptTokenCount,
    completionTokens: usage.candidatesTokenCount,
    totalTokens: usage.totalTokenCount,
  };
}
