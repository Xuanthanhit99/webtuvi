import { StreamService } from './stream.service';
import type { StreamChunk } from '../providers/provider.types';

const PENDING_MESSAGE = { id: 'msg-1', conversationId: 'conv-1', role: 'USER', content: 'hi', createdAt: new Date() };

function makePrisma(overrides: Partial<{ findMany: unknown }> = {}) {
  return {
    conversationMessage: {
      findMany: overrides.findMany ?? jest.fn(async () => [PENDING_MESSAGE]),
      create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => ({
        id: 'msg-2',
        conversationId: data.conversationId,
        role: data.role,
        content: data.content,
        metadata: data.metadata,
        createdAt: new Date(),
      })),
    },
    conversation: {
      update: jest.fn(async () => ({})),
    },
  };
}

function makeDeps(overrides: {
  orchestratorChunks?: StreamChunk[];
  orchestratorGen?: () => AsyncGenerator<StreamChunk & { provider: 'mock' }>;
  lockAcquired?: boolean;
  safetyAllowed?: boolean;
  findManyOverride?: unknown;
}) {
  const prisma = makePrisma({ findMany: overrides.findManyOverride });
  const conversationService = { findOwned: jest.fn(async () => ({ id: 'conv-1', userId: 'user-1' })) };
  const contextBuilder = { build: jest.fn(async () => ({})) };
  const promptBuilder = { build: jest.fn(() => []) };
  const safety = {
    checkOutput: jest.fn(() => (overrides.safetyAllowed === false ? { allowed: false, category: 'fabricated_sensitive_data', refusalMessage: 'refused' } : { allowed: true, category: 'none' })),
  };
  const observability = { logUsage: jest.fn() };
  const costControl = { record: jest.fn(async () => 0.001) };
  async function* defaultStreamGen(): AsyncGenerator<StreamChunk & { provider: 'mock' }> {
    for (const chunk of overrides.orchestratorChunks ?? []) {
      yield { ...chunk, provider: 'mock' } as StreamChunk & { provider: 'mock' };
    }
  }
  const orchestrator = { stream: jest.fn(overrides.orchestratorGen ?? defaultStreamGen) };
  const concurrency = {
    tryAcquire: jest.fn(async () => overrides.lockAcquired ?? true),
    release: jest.fn(async () => undefined),
  };

  const service = new StreamService(
    prisma as never,
    conversationService as never,
    contextBuilder as never,
    promptBuilder as never,
    safety as never,
    observability as never,
    costControl as never,
    orchestrator as never,
    concurrency as never,
  );

  return { service, prisma, concurrency, costControl, observability };
}

async function collect<T>(gen: AsyncGenerator<T>): Promise<T[]> {
  const items: T[] = [];
  for await (const item of gen) items.push(item);
  return items;
}

describe('StreamService.generate — concurrency lock lifecycle (Sprint 2B audit Finding 2B)', () => {
  it('releases the lock after a successful generation', async () => {
    const { service, concurrency } = makeDeps({
      orchestratorChunks: [
        { type: 'token', content: 'hi ' },
        { type: 'done', model: 'mock-model', usage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 } },
      ],
    });

    await collect(service.generate('user-1', 'conv-1', new AbortController().signal));

    expect(concurrency.tryAcquire).toHaveBeenCalledWith('user-1');
    expect(concurrency.release).toHaveBeenCalledWith('user-1');
    expect(concurrency.release).toHaveBeenCalledTimes(1);
  });

  it('releases the lock after a provider error', async () => {
    const { service, concurrency } = makeDeps({
      orchestratorChunks: [{ type: 'error', message: 'boom', retryable: false, code: 'PROVIDER_UNAVAILABLE' }],
    });

    await collect(service.generate('user-1', 'conv-1', new AbortController().signal));

    expect(concurrency.release).toHaveBeenCalledWith('user-1');
  });

  it('releases the lock after a client-driven cancellation (aborted signal), and still persists a placeholder turn', async () => {
    const controller = new AbortController();
    // A real provider stream stops emitting once its AbortSignal fires; this
    // simulates that by yielding one token, aborting, then ending the
    // generator early without a 'done'/'error' chunk — the exact shape
    // StreamService's post-loop cancellation-persistence branch handles.
    async function* neverEnds(): AsyncGenerator<StreamChunk & { provider: 'mock' }> {
      yield { type: 'token', content: 'partial ', provider: 'mock' };
      controller.abort();
    }
    const { service, concurrency, prisma } = makeDeps({ orchestratorGen: neverEnds });

    const events = await collect(service.generate('user-1', 'conv-1', controller.signal));

    expect(events.some((e) => e.type === 'token')).toBe(true);
    expect(concurrency.release).toHaveBeenCalledWith('user-1');
    expect(prisma.conversationMessage.create).toHaveBeenCalledTimes(1);
    const persisted = (prisma.conversationMessage.create as jest.Mock).mock.calls[0][0].data;
    expect(persisted.metadata.cancelled).toBe(true);
  });

  it('does not acquire a lock and never calls the orchestrator when a second generation is already active for the user', async () => {
    const { service, concurrency } = makeDeps({ orchestratorChunks: [], lockAcquired: false });

    const events = await collect(service.generate('user-1', 'conv-1', new AbortController().signal));

    expect(events).toHaveLength(1);
    expect(events[0]!.type).toBe('error');
    expect(events[0]!.data.code).toBe('CONCURRENT_GENERATION');
    expect(concurrency.release).not.toHaveBeenCalled();
  });
});

describe('StreamService.generate — no fabricated content or duplicate charges on provider failure (Finding 1 & 2C)', () => {
  it('persists no assistant message and records no usage when every provider fails (PROVIDER_UNAVAILABLE)', async () => {
    const { service, prisma, costControl } = makeDeps({
      orchestratorChunks: [{ type: 'error', message: 'All AI providers are currently unavailable.', retryable: true, code: 'PROVIDER_UNAVAILABLE' }],
    });

    const events = await collect(service.generate('user-1', 'conv-1', new AbortController().signal));

    expect(events).toHaveLength(1);
    expect(events[0]!.type).toBe('error');
    expect(events[0]!.data.code).toBe('PROVIDER_UNAVAILABLE');
    expect(prisma.conversationMessage.create).not.toHaveBeenCalled();
    expect(costControl.record).not.toHaveBeenCalled();
  });

  it('records usage exactly once for a turn that succeeds, even though the orchestrator streamed multiple token chunks', async () => {
    const { service, costControl, prisma } = makeDeps({
      orchestratorChunks: [
        { type: 'token', content: 'a ' },
        { type: 'token', content: 'b ' },
        { type: 'token', content: 'c ' },
        { type: 'done', model: 'mock-model', usage: { promptTokens: 3, completionTokens: 3, totalTokens: 6 } },
      ],
    });

    await collect(service.generate('user-1', 'conv-1', new AbortController().signal));

    expect(costControl.record).toHaveBeenCalledTimes(1);
    expect(prisma.conversationMessage.create).toHaveBeenCalledTimes(1);
  });
});
