import { ProviderOrchestratorService } from './provider-orchestrator.service';
import { AIProviderError, type AIProviderName, type ChatMessage, type StreamChunk } from './provider.types';
import type { AIProvider } from './ai-provider.interface';

function fakeProvider(name: AIProviderName, behavior: () => AsyncIterable<StreamChunk>): AIProvider {
  return {
    name,
    chat: jest.fn(),
    stream: behavior,
    countTokens: () => 1,
    estimateCost: () => 0,
    health: async () => true,
    supportsStreaming: () => true,
    supportsJson: () => true,
    supportsVision: () => false,
  };
}

async function* alwaysFailsBeforeAnyToken(): AsyncIterable<StreamChunk> {
  throw new AIProviderError('down', true, 503);
}

async function* succeedsWithOneToken(): AsyncIterable<StreamChunk> {
  yield { type: 'token', content: 'Hi ' };
  yield { type: 'done', model: 'test-model', usage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 } };
}

async function* failsAfterOneToken(): AsyncIterable<StreamChunk> {
  yield { type: 'token', content: 'Hi ' };
  throw new AIProviderError('dropped mid-stream', true, 500);
}

interface FakeAiConfig {
  defaultProvider: AIProviderName;
  fallbackProvider?: AIProviderName;
  maxRetries: number;
}

function buildOrchestrator(providers: Partial<Record<AIProviderName, AIProvider>>, ai: FakeAiConfig) {
  const registry = {
    has: (n: AIProviderName) => n in providers,
    get: (n: AIProviderName) => providers[n]!,
  };
  const configService = { get: () => ({ ai }) };
  const observability = { logProviderCall: jest.fn().mockResolvedValue(undefined) };
  return new ProviderOrchestratorService(registry as never, configService as never, observability as never);
}

const messages: ChatMessage[] = [{ role: 'user', content: 'hi' }];

describe('ProviderOrchestratorService', () => {
  it('streams normally from the default provider when it succeeds', async () => {
    const providers = { openai: fakeProvider('openai', succeedsWithOneToken) };
    const orchestrator = buildOrchestrator(providers, { defaultProvider: 'openai', maxRetries: 1 });

    const chunks: (StreamChunk & { provider: AIProviderName })[] = [];
    for await (const chunk of orchestrator.stream(messages)) chunks.push(chunk);

    expect(chunks.some((c) => c.type === 'token')).toBe(true);
    expect(chunks[chunks.length - 1]!.type).toBe('done');
    expect(chunks.every((c) => c.provider === 'openai')).toBe(true);
  });

  it('falls back to the next provider in the chain when the default fails before any token', async () => {
    const providers = {
      openai: fakeProvider('openai', alwaysFailsBeforeAnyToken),
      anthropic: fakeProvider('anthropic', succeedsWithOneToken),
    };
    const orchestrator = buildOrchestrator(providers, {
      defaultProvider: 'openai',
      fallbackProvider: 'anthropic',
      maxRetries: 0,
    });

    const chunks: (StreamChunk & { provider: AIProviderName })[] = [];
    for await (const chunk of orchestrator.stream(messages)) chunks.push(chunk);

    const doneChunk = chunks.find((c) => c.type === 'done');
    expect(doneChunk).toBeDefined();
    expect(doneChunk!.provider).toBe('anthropic');
  });

  it('does not fall back once a token has already been emitted — ends with an error chunk instead', async () => {
    const providers = {
      openai: fakeProvider('openai', failsAfterOneToken),
      anthropic: fakeProvider('anthropic', succeedsWithOneToken),
    };
    const orchestrator = buildOrchestrator(providers, {
      defaultProvider: 'openai',
      fallbackProvider: 'anthropic',
      maxRetries: 0,
    });

    const chunks: (StreamChunk & { provider: AIProviderName })[] = [];
    for await (const chunk of orchestrator.stream(messages)) chunks.push(chunk);

    expect(chunks.some((c) => c.type === 'token' && c.provider === 'openai')).toBe(true);
    const last = chunks[chunks.length - 1]!;
    expect(last.type).toBe('error');
    expect(last.provider).toBe('openai');
    // anthropic (the fallback) must never have been reached
    expect(chunks.some((c) => c.provider === 'anthropic')).toBe(false);
  });

  it('never loops infinitely: exhausts a finite chain and yields a terminal error when every provider fails', async () => {
    const providers = {
      openai: fakeProvider('openai', alwaysFailsBeforeAnyToken),
      anthropic: fakeProvider('anthropic', alwaysFailsBeforeAnyToken),
      mock: fakeProvider('mock', alwaysFailsBeforeAnyToken),
    };
    const orchestrator = buildOrchestrator(providers, {
      defaultProvider: 'openai',
      fallbackProvider: 'anthropic',
      maxRetries: 0,
    });

    const chunks: (StreamChunk & { provider: AIProviderName })[] = [];
    for await (const chunk of orchestrator.stream(messages)) chunks.push(chunk);

    expect(chunks).toHaveLength(1);
    const only = chunks[0]!;
    expect(only.type).toBe('error');
    if (only.type === 'error') {
      expect(only.message).toMatch(/unavailable/i);
    }
  });

  it('retries the same provider on a retryable failure before falling back', async () => {
    let calls = 0;
    async function* flakyThenSucceeds(): AsyncIterable<StreamChunk> {
      calls += 1;
      if (calls === 1) throw new AIProviderError('transient', true, 429);
      yield { type: 'token', content: 'ok ' };
      yield { type: 'done', model: 'test-model', usage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 } };
    }
    const providers = { openai: fakeProvider('openai', flakyThenSucceeds) };
    const orchestrator = buildOrchestrator(providers, { defaultProvider: 'openai', maxRetries: 2 });

    const chunks: (StreamChunk & { provider: AIProviderName })[] = [];
    for await (const chunk of orchestrator.stream(messages)) chunks.push(chunk);

    expect(calls).toBe(2);
    expect(chunks[chunks.length - 1]!.type).toBe('done');
  });
});
