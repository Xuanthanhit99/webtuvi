import { MockProvider } from './mock.provider';
import type { ChatMessage } from './provider.types';

describe('MockProvider', () => {
  let provider: MockProvider;

  beforeEach(() => {
    provider = new MockProvider();
  });

  it('reports its capabilities without any network dependency', () => {
    expect(provider.name).toBe('mock');
    expect(provider.supportsStreaming()).toBe(true);
  });

  it('chat() returns a deterministic non-empty reply with usage figures', async () => {
    const messages: ChatMessage[] = [{ role: 'user', content: 'Hello there' }];
    const result = await provider.chat(messages);

    expect(result.content.length).toBeGreaterThan(0);
    expect(result.usage.promptTokens).toBeGreaterThan(0);
    expect(result.usage.completionTokens).toBeGreaterThan(0);
    expect(result.usage.totalTokens).toBe(result.usage.promptTokens + result.usage.completionTokens);
  });

  it('varies the reply based on how many prior user turns exist, so a conversation does not loop the same line', async () => {
    const first = await provider.chat([{ role: 'user', content: 'One' }]);
    const second = await provider.chat([
      { role: 'user', content: 'One' },
      { role: 'assistant', content: 'reply' },
      { role: 'user', content: 'Two' },
    ]);
    expect(first.content).not.toBe(second.content);
  });

  it('stream() yields token chunks followed by a done chunk with usage', async () => {
    const chunks = [];
    for await (const chunk of provider.stream([{ role: 'user', content: 'Hi' }])) {
      chunks.push(chunk);
    }

    const tokenChunks = chunks.filter((c) => c.type === 'token');
    const doneChunk = chunks[chunks.length - 1];

    expect(tokenChunks.length).toBeGreaterThan(0);
    expect(doneChunk!.type).toBe('done');
    if (doneChunk!.type === 'done') {
      expect(doneChunk!.usage.totalTokens).toBeGreaterThan(0);
    }
  });

  it('stream() stops immediately and emits nothing once the signal is already aborted (cancel)', async () => {
    const controller = new AbortController();
    controller.abort();

    const chunks = [];
    for await (const chunk of provider.stream([{ role: 'user', content: 'Hi' }], { signal: controller.signal })) {
      chunks.push(chunk);
    }

    expect(chunks).toHaveLength(0);
  });

  it('estimateCost is always 0 (no real spend for the mock provider)', () => {
    expect(provider.estimateCost({ promptTokens: 100, completionTokens: 100, totalTokens: 200 }, 'mock-model')).toBe(0);
  });
});
