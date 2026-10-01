import { Injectable } from '@nestjs/common';
import type { AIProvider } from './ai-provider.interface';
import type { AIProviderName, ChatMessage, ChatOptions, ChatResult, StreamChunk, TokenUsage } from './provider.types';
import { estimateTokens } from './token-estimate.util';
import { estimateCostUsd } from './pricing';

const MOCK_MODEL = 'mock-model';

const REPLIES = [
  'Mình đang lắng nghe. Điều gì đang hiện rõ nhất với bạn lúc này?',
  'Điều đó có vẻ đáng để nhìn lại. Một bước nhỏ nào sẽ giúp bạn tiến về phía trước?',
  'Cảm ơn bạn đã chia sẻ. Có phần nào bạn muốn cùng suy nghĩ kỹ hơn không?',
  'Mình đang lắng nghe. Bạn muốn nói thêm hay tạm dừng ở đây?',
];

/**
 * Deterministic, no-network provider — for unit tests, CI, and offline
 * development (DEFAULT_AI_PROVIDER=mock). Never selected in production (see
 * env.validation.ts). Simulates streaming by chunking a canned reply into
 * words, with a small delay between chunks so streaming UI can be exercised
 * without a real model.
 */
@Injectable()
export class MockProvider implements AIProvider {
  readonly name: AIProviderName = 'mock';

  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResult> {
    const content = this.pickReply(messages);
    const usage = this.usageFor(messages, content);
    return { content, model: options?.model ?? MOCK_MODEL, usage };
  }

  async *stream(messages: ChatMessage[], options?: ChatOptions): AsyncIterable<StreamChunk> {
    const content = this.pickReply(messages);
    const words = content.split(' ');

    for (const word of words) {
      if (options?.signal?.aborted) return;
      await new Promise((resolve) => setTimeout(resolve, 15));
      yield { type: 'token', content: `${word} ` };
    }

    if (options?.signal?.aborted) return;
    const usage = this.usageFor(messages, content);
    yield { type: 'done', usage, model: options?.model ?? MOCK_MODEL };
  }

  countTokens(text: string): number {
    return estimateTokens(text);
  }

  estimateCost(usage: TokenUsage, model: string): number {
    return estimateCostUsd('mock', model, usage.promptTokens, usage.completionTokens);
  }

  supportsStreaming(): boolean {
    return true;
  }

  supportsJson(): boolean {
    return true;
  }

  supportsVision(): boolean {
    return false;
  }

  private pickReply(messages: ChatMessage[]): string {
    const userTurns = messages.filter((m) => m.role === 'user').length;
    return REPLIES[userTurns % REPLIES.length]!;
  }

  private usageFor(messages: ChatMessage[], content: string): TokenUsage {
    const promptTokens = messages.reduce((sum, m) => sum + estimateTokens(m.content), 0);
    const completionTokens = estimateTokens(content);
    return { promptTokens, completionTokens, totalTokens: promptTokens + completionTokens };
  }
}
