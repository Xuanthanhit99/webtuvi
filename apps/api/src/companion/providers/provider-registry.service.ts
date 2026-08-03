import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppConfiguration } from '../../config/configuration';
import type { AIProvider } from './ai-provider.interface';
import type { AIProviderName } from './provider.types';
import { MockProvider } from './mock.provider';
import { OpenAIProvider } from './openai.provider';
import { AnthropicProvider } from './anthropic.provider';
import { GeminiProvider } from './gemini.provider';

/**
 * Constructs each provider once, at startup, from env-driven credentials —
 * never hard-coded. A real provider is only registered if its API key is
 * present. `ProviderOrchestratorService` is the only consumer that should
 * call `get()`.
 *
 * The deterministic Mock provider is registered only outside production
 * (`NODE_ENV !== 'production'`) or when `AI_ENABLE_MOCK_PROVIDER=true` is
 * explicitly set — and `env.validation.ts` independently fails boot if that
 * flag is ever true in production, so this is a second, defense-in-depth gate
 * on top of the boot-time check, not the only thing standing between
 * production traffic and a fabricated reply. See docs/security/ai-safety.md
 * "Mock provider" for the full reasoning (Sprint 2B audit Finding 1).
 */
@Injectable()
export class ProviderRegistryService {
  private readonly providers = new Map<AIProviderName, AIProvider>();

  constructor(
    private readonly configService: ConfigService,
    mockProvider: MockProvider,
  ) {
    const config = this.configService.get<AppConfiguration>('app')!;
    const mockAllowed = config.nodeEnv !== 'production' || config.ai.enableMockProvider;

    if (mockAllowed) {
      this.providers.set('mock', mockProvider);
    }
    if (config.ai.openaiApiKey) {
      this.providers.set('openai', new OpenAIProvider(config.ai.openaiApiKey, config.ai.timeoutMs));
    }
    if (config.ai.anthropicApiKey) {
      this.providers.set('anthropic', new AnthropicProvider(config.ai.anthropicApiKey, config.ai.timeoutMs));
    }
    if (config.ai.geminiApiKey) {
      this.providers.set('gemini', new GeminiProvider(config.ai.geminiApiKey, config.ai.timeoutMs));
    }
  }

  get(name: AIProviderName): AIProvider {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new Error(`AI provider "${name}" is not configured (missing API key)`);
    }
    return provider;
  }

  has(name: AIProviderName): boolean {
    return this.providers.has(name);
  }
}
