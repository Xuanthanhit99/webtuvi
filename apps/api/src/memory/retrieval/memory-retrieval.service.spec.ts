import { MemoryRetrievalService } from './memory-retrieval.service';

const OWNER = 'user-1';

interface MemoryOverrides {
  id: string;
  type?: string;
  title?: string;
  summary?: string;
  status?: string;
  pinned?: boolean;
  importanceScore?: number;
  importanceFactors?: Record<string, number> | null;
  referencedCount?: number;
  createdAt?: Date;
  lastReferencedAt?: Date | null;
}

function makeMemory(o: MemoryOverrides) {
  return {
    id: o.id,
    userId: OWNER,
    type: o.type ?? 'PREFERENCE',
    title: o.title ?? `Title ${o.id}`,
    summary: o.summary ?? `Summary ${o.id}`,
    status: o.status ?? 'ACCEPTED',
    pinned: o.pinned ?? false,
    importanceScore: o.importanceScore ?? 0,
    importanceFactors: o.importanceFactors ?? null,
    referencedCount: o.referencedCount ?? 0,
    createdAt: o.createdAt ?? new Date('2026-01-01'),
    lastReferencedAt: o.lastReferencedAt ?? null,
  };
}

function makePrismaMock(memories: ReturnType<typeof makeMemory>[]) {
  const store = new Map(memories.map((m) => [m.id, { ...m }]));
  return {
    memory: {
      findMany: jest.fn(async ({ where }: { where: { userId: string; status: string } }) =>
        [...store.values()]
          .filter((m) => m.userId === where.userId && m.status === where.status)
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
      ),
      updateMany: jest.fn(async ({ where, data }: { where: { id: { in: string[] } }; data: Record<string, unknown> }) => {
        for (const id of where.id.in) {
          const existing = store.get(id);
          if (!existing) continue;
          const referencedCountData = data.referencedCount as { increment: number } | undefined;
          store.set(id, {
            ...existing,
            lastReferencedAt: (data.lastReferencedAt as Date) ?? existing.lastReferencedAt,
            referencedCount: referencedCountData ? existing.referencedCount + referencedCountData.increment : existing.referencedCount,
          });
        }
        return { count: where.id.in.length };
      }),
    },
    memoryRetrievalLog: {
      create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => data),
    },
    _store: store,
  };
}

function makeConsentMock(deniedTypes: string[] = []) {
  return {
    canAccept: jest.fn(async (_userId: string, type: string) => ({ allowed: !deniedTypes.includes(type), mode: 'ALLOW_TYPE' as const })),
  };
}

function makeBudgetMock(memoryTokens = 10_000) {
  return {
    computeBudget: jest.fn(() => ({
      totalWindowTokens: 8000,
      reservedOutputTokens: 1000,
      systemPromptTokens: 0,
      conversationTokens: 0,
      userInputTokens: 0,
      memoryTokens,
    })),
    fitToBudget: jest.fn((items: { id: string; text: string }[], budget: number) => {
      const included: typeof items = [];
      let used = 0;
      for (const item of items) {
        const cost = Math.ceil(item.text.length / 4);
        if (used + cost <= budget) {
          included.push(item);
          used += cost;
        }
      }
      return { included, excluded: items.filter((i) => !included.includes(i)), tokenUsed: used };
    }),
  };
}

describe('MemoryRetrievalService', () => {
  it('only ever queries ACCEPTED memories (hard exclusion of deleted/archived/rejected/pending)', async () => {
    const prisma = makePrismaMock([makeMemory({ id: 'a' })]);
    const service = new MemoryRetrievalService(prisma as never, makeConsentMock() as never, makeBudgetMock() as never);

    await service.recommend(OWNER);
    expect(prisma.memory.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: OWNER, status: 'ACCEPTED' } }),
    );
  });

  it('excludes a type the user currently denies, even though the row is still ACCEPTED', async () => {
    const memories = [makeMemory({ id: 'a', type: 'HEALTH' }), makeMemory({ id: 'b', type: 'PREFERENCE' })];
    const prisma = makePrismaMock(memories);
    const consent = makeConsentMock(['HEALTH']);
    const service = new MemoryRetrievalService(prisma as never, consent as never, makeBudgetMock() as never);

    const result = await service.recommend(OWNER);
    expect(result.items.map((i) => i.id)).toEqual(['b']);
  });

  it('orders results using the ranking policy (pinned first)', async () => {
    const memories = [
      makeMemory({ id: 'unpinned', importanceScore: 90 }),
      makeMemory({ id: 'pinned', importanceScore: 5, pinned: true }),
    ];
    const prisma = makePrismaMock(memories);
    const service = new MemoryRetrievalService(prisma as never, makeConsentMock() as never, makeBudgetMock() as never);

    const result = await service.recommend(OWNER);
    expect(result.items.map((i) => i.id)).toEqual(['pinned', 'unpinned']);
  });

  it('truncates to the token budget and reports tokenUsed', async () => {
    const memories = [makeMemory({ id: 'a', summary: 'x'.repeat(400) }), makeMemory({ id: 'b', summary: 'y'.repeat(400) })];
    const prisma = makePrismaMock(memories);
    const service = new MemoryRetrievalService(prisma as never, makeConsentMock() as never, makeBudgetMock(50) as never);

    const result = await service.recommend(OWNER);
    expect(result.items.length).toBeLessThan(2);
    expect(result.tokenUsed).toBeLessThanOrEqual(50);
  });

  it('respects an explicit limit even when the budget would allow more', async () => {
    const memories = [makeMemory({ id: 'a' }), makeMemory({ id: 'b' }), makeMemory({ id: 'c' })];
    const prisma = makePrismaMock(memories);
    const service = new MemoryRetrievalService(prisma as never, makeConsentMock() as never, makeBudgetMock() as never);

    const result = await service.recommend(OWNER, { limit: 1 });
    expect(result.items).toHaveLength(1);
  });

  it('bumps referencedCount/lastReferencedAt only for included memories', async () => {
    const memories = [makeMemory({ id: 'a' }), makeMemory({ id: 'b' })];
    const prisma = makePrismaMock(memories);
    const service = new MemoryRetrievalService(prisma as never, makeConsentMock() as never, makeBudgetMock() as never);

    await service.recommend(OWNER, { limit: 1 });
    const included = [...prisma._store.values()].find((m) => m.referencedCount > 0)!;
    const excluded = [...prisma._store.values()].find((m) => m.id !== included.id)!;
    expect(included.lastReferencedAt).not.toBeNull();
    expect(excluded.referencedCount).toBe(0);
  });

  it('falls back to all candidates when a context filter matches nothing', async () => {
    const memories = [makeMemory({ id: 'a', title: 'Coffee', summary: 'I like coffee' })];
    const prisma = makePrismaMock(memories);
    const service = new MemoryRetrievalService(prisma as never, makeConsentMock() as never, makeBudgetMock() as never);

    const result = await service.recommend(OWNER, { contextText: 'completely unrelated topic zzz' });
    expect(result.items).toHaveLength(1);
  });

  it('prioritizes memories matching the given context over non-matching ones', async () => {
    const memories = [
      makeMemory({ id: 'unrelated', title: 'Pets', summary: 'I have a cat', importanceScore: 50 }),
      makeMemory({ id: 'coffee', title: 'Coffee', summary: 'I like drinking coffee', importanceScore: 50 }),
    ];
    const prisma = makePrismaMock(memories);
    const service = new MemoryRetrievalService(prisma as never, makeConsentMock() as never, makeBudgetMock() as never);

    const result = await service.recommend(OWNER, { contextText: 'Tell me about coffee' });
    expect(result.items.map((i) => i.id)).toEqual(['coffee']);
  });

  it('writes a MemoryRetrievalLog with structural counts only, never memory content', async () => {
    const memories = [makeMemory({ id: 'a' })];
    const prisma = makePrismaMock(memories);
    const service = new MemoryRetrievalService(prisma as never, makeConsentMock() as never, makeBudgetMock() as never);

    await service.recommend(OWNER);
    expect(prisma.memoryRetrievalLog.create).toHaveBeenCalledTimes(1);
    const loggedData = prisma.memoryRetrievalLog.create.mock.calls[0]![0].data as Record<string, unknown>;
    expect(Object.keys(loggedData).sort()).toEqual(
      ['candidateCount', 'latencyMs', 'retrievedCount', 'tokenBudget', 'tokenUsed', 'userId'].sort(),
    );
  });

  it('never exposes a raw score without an explanation array alongside it', async () => {
    const memories = [makeMemory({ id: 'a', importanceScore: 42, importanceFactors: { recency: 10 } })];
    const prisma = makePrismaMock(memories);
    const service = new MemoryRetrievalService(prisma as never, makeConsentMock() as never, makeBudgetMock() as never);

    const result = await service.recommend(OWNER);
    expect(result.items[0]!.importanceScore).toBe(42);
    expect(result.items[0]!.importanceExplanations.length).toBeGreaterThan(0);
    expect(result.items[0]!.whyRecommended).toEqual(expect.any(String));
  });

  // --- Sprint 3C (Companion integration) additions ---

  it('every returned memory carries memoryId/reason/retrievalType/importance/retrievalTimestamp/sourceConversation (Phase 2, "no hidden retrieval")', async () => {
    const memories = [makeMemory({ id: 'a' })];
    const prisma = makePrismaMock(memories);
    const service = new MemoryRetrievalService(prisma as never, makeConsentMock() as never, makeBudgetMock() as never);

    const result = await service.recommend(OWNER);
    const item = result.items[0]!;
    expect(item.id).toBe('a');
    expect(item.whyRecommended).toEqual(expect.any(String));
    expect(['PINNED', 'CONTEXT_MATCH', 'IMPORTANCE_RANKED']).toContain(item.retrievalType);
    expect(item.importanceScore).toEqual(expect.any(Number));
    expect(() => new Date(item.retrievalTimestamp).toISOString()).not.toThrow();
    expect(item).toHaveProperty('sourceConversationId');
  });

  it('marks a pinned memory\'s retrievalType as PINNED even when it also matches context', async () => {
    const memories = [makeMemory({ id: 'a', pinned: true, title: 'Coffee', summary: 'I like coffee' })];
    const prisma = makePrismaMock(memories);
    const service = new MemoryRetrievalService(prisma as never, makeConsentMock() as never, makeBudgetMock() as never);

    const result = await service.recommend(OWNER, { contextText: 'coffee' });
    expect(result.items[0]!.retrievalType).toBe('PINNED');
  });

  it('marks retrievalType CONTEXT_MATCH when unpinned and the context text overlaps', async () => {
    const memories = [makeMemory({ id: 'a', title: 'Coffee', summary: 'I like drinking coffee' })];
    const prisma = makePrismaMock(memories);
    const service = new MemoryRetrievalService(prisma as never, makeConsentMock() as never, makeBudgetMock() as never);

    const result = await service.recommend(OWNER, { contextText: 'Tell me about coffee' });
    expect(result.items[0]!.retrievalType).toBe('CONTEXT_MATCH');
  });

  it('marks retrievalType IMPORTANCE_RANKED when unpinned and there is no context', async () => {
    const memories = [makeMemory({ id: 'a' })];
    const prisma = makePrismaMock(memories);
    const service = new MemoryRetrievalService(prisma as never, makeConsentMock() as never, makeBudgetMock() as never);

    const result = await service.recommend(OWNER);
    expect(result.items[0]!.retrievalType).toBe('IMPORTANCE_RANKED');
  });

  it('reports a consent-denied memory as skipped with reason consent_denied (Phase 8 explainability)', async () => {
    const memories = [makeMemory({ id: 'a', type: 'HEALTH' }), makeMemory({ id: 'b', type: 'PREFERENCE' })];
    const prisma = makePrismaMock(memories);
    const consent = makeConsentMock(['HEALTH']);
    const service = new MemoryRetrievalService(prisma as never, consent as never, makeBudgetMock() as never);

    const result = await service.recommend(OWNER);
    expect(result.skipped).toContainEqual({ id: 'a', type: 'HEALTH', title: 'Title a', reason: 'consent_denied' });
  });

  it('reports a budget-excluded memory as skipped with reason over_budget', async () => {
    const memories = [makeMemory({ id: 'a', summary: 'x'.repeat(400) }), makeMemory({ id: 'b', summary: 'y'.repeat(400) })];
    const prisma = makePrismaMock(memories);
    const service = new MemoryRetrievalService(prisma as never, makeConsentMock() as never, makeBudgetMock(50) as never);

    const result = await service.recommend(OWNER);
    expect(result.skipped.some((s) => s.reason === 'over_budget')).toBe(true);
  });

  it('reports a limit-excluded memory as skipped with reason limit_reached', async () => {
    const memories = [makeMemory({ id: 'a' }), makeMemory({ id: 'b' })];
    const prisma = makePrismaMock(memories);
    const service = new MemoryRetrievalService(prisma as never, makeConsentMock() as never, makeBudgetMock() as never);

    const result = await service.recommend(OWNER, { limit: 1 });
    expect(result.skipped).toHaveLength(1);
    expect(result.skipped[0]!.reason).toBe('limit_reached');
  });

  it('never fabricates a skip reason — skipped is empty when nothing was actually excluded', async () => {
    const memories = [makeMemory({ id: 'a' })];
    const prisma = makePrismaMock(memories);
    const service = new MemoryRetrievalService(prisma as never, makeConsentMock() as never, makeBudgetMock() as never);

    const result = await service.recommend(OWNER);
    expect(result.skipped).toEqual([]);
  });
});
