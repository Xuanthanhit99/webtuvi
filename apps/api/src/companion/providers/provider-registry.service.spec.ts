import { ProviderRegistryService } from './provider-registry.service';
import { MockProvider } from './mock.provider';
import type { ConfigService } from '@nestjs/config';

interface FakeAppConfig {
  nodeEnv: 'development' | 'test' | 'production';
  ai: {
    enableMockProvider: boolean;
    openaiApiKey?: string;
    anthropicApiKey?: string;
    geminiApiKey?: string;
    timeoutMs: number;
  };
}

function makeConfigService(config: FakeAppConfig): ConfigService {
  return { get: () => config } as unknown as ConfigService;
}

const BASE_AI = { openaiApiKey: undefined, anthropicApiKey: undefined, geminiApiKey: undefined, timeoutMs: 30_000 };

describe('ProviderRegistryService — Mock provider production gating (Sprint 2B audit Finding 1)', () => {
  it('registers the Mock provider in development', () => {
    const registry = new ProviderRegistryService(
      makeConfigService({ nodeEnv: 'development', ai: { ...BASE_AI, enableMockProvider: false } }),
      new MockProvider(),
    );
    expect(registry.has('mock')).toBe(true);
  });

  it('registers the Mock provider in test', () => {
    const registry = new ProviderRegistryService(
      makeConfigService({ nodeEnv: 'test', ai: { ...BASE_AI, enableMockProvider: false } }),
      new MockProvider(),
    );
    expect(registry.has('mock')).toBe(true);
  });

  it('does NOT register the Mock provider in production (default, flag unset)', () => {
    const registry = new ProviderRegistryService(
      makeConfigService({ nodeEnv: 'production', ai: { ...BASE_AI, enableMockProvider: false } }),
      new MockProvider(),
    );
    expect(registry.has('mock')).toBe(false);
    expect(() => registry.get('mock')).toThrow();
  });

  it('real providers are only registered when their API key is present, independent of the mock gate', () => {
    const registry = new ProviderRegistryService(
      makeConfigService({
        nodeEnv: 'production',
        ai: { ...BASE_AI, enableMockProvider: false, openaiApiKey: 'sk-test' },
      }),
      new MockProvider(),
    );
    expect(registry.has('openai')).toBe(true);
    expect(registry.has('anthropic')).toBe(false);
    expect(registry.has('mock')).toBe(false);
  });
});
