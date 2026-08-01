import type { AIProviderName, ChatMessage, ChatOptions, ChatResult, StreamChunk, TokenUsage } from './provider.types';

/**
 * Every provider (OpenAI, Anthropic, Gemini, Mock) implements this exactly —
 * nothing in the rest of Companion Core (PromptBuilder, ConversationService,
 * StreamService) ever imports a provider-specific type or SDK.
 */
export interface AIProvider {
  readonly name: AIProviderName;

  chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResult>;

  stream(messages: ChatMessage[], options?: ChatOptions): AsyncIterable<StreamChunk>;

  /** Approximate — see CHARS_PER_TOKEN_ESTIMATE for why this is a heuristic, not exact tokenization. */
  countTokens(text: string): number;

  /** USD, from a static per-provider/per-model pricing table — see providers/pricing.ts. */
  estimateCost(usage: TokenUsage, model: string): number;

  /** Cheap reachability check (no full generation) — used by ProviderOrchestrator before committing to a provider. */
  health(): Promise<boolean>;

  supportsStreaming(): boolean;
  supportsJson(): boolean;
  supportsVision(): boolean;
}
