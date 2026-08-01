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
 * never hard-coded. A provider is only registered if its API key is present
 * (mock is always available). `ProviderOrchestratorService` is the only
 * consumer that should call `get()`.
 */
@Injectable()
export class ProviderRegistryService {
  private readonly providers = new Map<AIProviderName, AIProvider>();

  constructor(
    private readonly configService: ConfigService,
    mockProvider: MockProvider,
  ) {
    const config = this.configService.get<AppConfiguration>('app')!.ai;

    this.providers.set('mock', mockProvider);
    if (config.openaiApiKey) {
      this.providers.set('openai', new OpenAIProvider(config.openaiApiKey, config.timeoutMs));
    }
    if (config.anthropicApiKey) {
      this.providers.set('anthropic', new AnthropicProvider(config.anthropicApiKey, config.timeoutMs));
    }
    if (config.geminiApiKey) {
      this.providers.set('gemini', new GeminiProvider(config.geminiApiKey, config.timeoutMs));
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
