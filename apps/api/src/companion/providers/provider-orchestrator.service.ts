import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppConfiguration } from '../../config/configuration';
import { ObservabilityService } from '../observability/observability.service';
import { ProviderRegistryService } from './provider-registry.service';
import { AIProviderError, type AIProviderName, type ChatMessage, type ChatOptions, type StreamChunk } from './provider.types';

export type OrchestratedStreamChunk = StreamChunk & { provider: AIProviderName };

function backoffDelayMs(attempt: number): number {
  const exponential = Math.min(500 * 2 ** attempt, 8000);
  return exponential * (0.8 + Math.random() * 0.4);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry (exponential backoff, on 429/5xx/timeout) + fallback
 * (DEFAULT_AI_PROVIDER -> FALLBACK_PROVIDER -> mock) in one place, so
 * StreamService never talks to a provider directly. The chain is always
 * finite (at most 3 distinct providers, each capped at AI_MAX_RETRIES
 * attempts) — never an infinite loop.
 *
 * Fallback only happens *before* the first token of a given provider's reply
 * has reached the caller: once generation has started streaming content, a
 * mid-stream failure ends that turn with an `error` chunk instead of silently
 * switching providers and confusing the client with two different voices in
 * one reply.
 */
@Injectable()
export class ProviderOrchestratorService {
  constructor(
    private readonly registry: ProviderRegistryService,
    private readonly configService: ConfigService,
    private readonly observability: ObservabilityService,
  ) {}

  private chain(): AIProviderName[] {
    const config = this.configService.get<AppConfiguration>('app')!.ai;
    const chain: AIProviderName[] = [config.defaultProvider];
    if (config.fallbackProvider && config.fallbackProvider !== config.defaultProvider) {
      chain.push(config.fallbackProvider);
    }
    if (!chain.includes('mock')) chain.push('mock');
    return chain.filter((name) => this.registry.has(name));
  }

  async *stream(messages: ChatMessage[], options?: ChatOptions): AsyncGenerator<OrchestratedStreamChunk> {
    const chain = this.chain();
    const maxRetries = this.configService.get<AppConfiguration>('app')!.ai.maxRetries;

    for (const providerName of chain) {
      const provider = this.registry.get(providerName);
      const startedAt = Date.now();
      let startedEmitting = false;
      let retryCount = 0;
      let failed = false;

      attempts: for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
        retryCount = attempt;
        try {
          for await (const chunk of provider.stream(messages, options)) {
            if (chunk.type === 'error') {
              throw new AIProviderError(chunk.message, chunk.retryable);
            }
            if (chunk.type === 'token') startedEmitting = true;
            yield { ...chunk, provider: providerName };
            if (chunk.type === 'done') {
              await this.observability.logProviderCall({
                provider: providerName,
                model: chunk.model,
                latencyMs: Date.now() - startedAt,
                success: true,
                retryCount,
                streamDurationMs: Date.now() - startedAt,
              });
              return;
            }
          }
          return; // generator ended without an explicit 'done' — nothing further to do
        } catch (error) {
          const retryable = error instanceof AIProviderError ? error.retryable : false;
          const canRetry = retryable && !startedEmitting && attempt < maxRetries;
          if (canRetry) {
            await delay(backoffDelayMs(attempt));
            continue;
          }
          failed = true;
          await this.observability.logProviderCall({
            provider: providerName,
            model: options?.model ?? 'unknown',
            latencyMs: Date.now() - startedAt,
            success: false,
            retryCount,
            errorCode: error instanceof AIProviderError ? String(error.statusCode ?? 'unknown') : 'unknown',
          });
          break attempts;
        }
      }

      if (failed && startedEmitting) {
        // Already showed the user partial content for this turn — end here, don't fall back.
        yield {
          type: 'error',
          message: 'The response was interrupted. Please try again.',
          retryable: true,
          provider: providerName,
        };
        return;
      }
      // Otherwise fall through to the next provider in the chain.
    }

    yield {
      type: 'error',
      message: 'All AI providers are currently unavailable. Please try again shortly.',
      retryable: true,
      provider: chain[chain.length - 1] ?? 'mock',
    };
  }
}
