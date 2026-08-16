import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TarotRecordService } from './tarot-record.service';
import type { TarotInterpretationService } from '../interpretation/tarot-interpretation.service';
import type { MemoryRetrievalService } from '../../memory/retrieval/memory-retrieval.service';
import type { EntitlementService } from '../../payment/entitlement/entitlement.service';

const OWNER = 'user-1';
const OTHER = 'user-2';

function makeReading(overrides: { id?: string; userId?: string; status?: string; type?: string; createdAt?: Date } = {}) {
  return {
    id: overrides.id ?? 'reading-1',
    userId: overrides.userId ?? OWNER,
    type: overrides.type ?? 'SINGLE_CARD',
    spreadId: 'spread-1',
    status: overrides.status ?? 'ACTIVE',
    visibility: 'COMPANION_VISIBLE',
    question: null,
    interpretation: 'A moment worth sitting with.',
    createdAt: overrides.createdAt ?? new Date('2026-01-05T00:00:00.000Z'),
    updatedAt: new Date('2026-01-05T00:00:00.000Z'),
    archivedAt: null,
    deletedAt: null,
    spread: { id: 'spread-1', slug: 'single-card', name: 'Single Card', cardCount: 1, positions: [{ order: 0, label: 'Focus' }] },
    cards: [],
  };
}

type Row = ReturnType<typeof makeReading>;

interface ReadingWhere {
  userId?: string;
  type?: string;
  status?: string | { not: string };
  createdAt?: { gte: Date };
}

function matchesWhere(row: Row, where: ReadingWhere = {}): boolean {
  if (where.userId !== undefined && row.userId !== where.userId) return false;
  if (where.type !== undefined && row.type !== where.type) return false;
  if (where.createdAt?.gte !== undefined && row.createdAt < where.createdAt.gte) return false;
  if (where.status !== undefined) {
    if (typeof where.status === 'string') {
      if (row.status !== where.status) return false;
    } else if (row.status === where.status.not) {
      return false;
    }
  }
  return true;
}

function makePrismaMock(seed: Row[] = []) {
  const rows = new Map(seed.map((r) => [r.id, r]));
  const history: { id: string; readingId: string; action: string; detail: string; createdAt: Date }[] = [];
  let counter = 0;

  return {
    tarotReading: {
      findUnique: jest.fn(async ({ where: { id } }: { where: { id: string } }) => rows.get(id) ?? null),
      findUniqueOrThrow: jest.fn(async ({ where: { id } }: { where: { id: string } }) => {
        const row = rows.get(id);
        if (!row) throw new Error('not found');
        return row;
      }),
      findFirst: jest.fn(async ({ where }: { where: ReadingWhere }) => [...rows.values()].find((r) => matchesWhere(r, where)) ?? null),
      count: jest.fn(async ({ where }: { where?: ReadingWhere } = {}) => [...rows.values()].filter((r) => matchesWhere(r, where)).length),
      findMany: jest.fn(async ({ where, orderBy, skip, take }: { where?: ReadingWhere; orderBy?: { createdAt?: 'asc' | 'desc' }; skip?: number; take?: number } = {}) => {
        let result = [...rows.values()].filter((r) => matchesWhere(r, where));
        if (orderBy?.createdAt === 'desc') result = result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        if (typeof skip === 'number') result = result.slice(skip);
        if (typeof take === 'number') result = result.slice(0, take);
        return result;
      }),
      update: jest.fn(async ({ where: { id }, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        const existing = rows.get(id)!;
        const updated = { ...existing, ...data };
        rows.set(id, updated);
        return updated;
      }),
    },
    tarotReadingHistory: {
      create: jest.fn(async ({ data }: { data: { readingId: string; action: string; detail: string } }) => {
        const entry = { id: `h${counter++}`, ...data, createdAt: new Date() };
        history.push(entry);
        return entry;
      }),
      findMany: jest.fn(async ({ where: { readingId } }: { where: { readingId: string } }) => history.filter((h) => h.readingId === readingId)),
    },
    // Unseeded in every test here — draw() should never get this far once the Phase 9/10 usage-limit
    // guards below have already rejected, so a null spread (-> TAROT_SPREAD_NOT_SEEDED) is a safe,
    // deliberate stand-in for "the guard passed and draw() moved on".
    tarotSpread: {
      findUnique: jest.fn(async () => null),
    },
  };
}

function makeService(seed: Row[] = [], isPremium = false) {
  const prisma = makePrismaMock(seed);
  const interpretation = { interpret: jest.fn().mockResolvedValue(null) } as unknown as TarotInterpretationService;
  const memoryRetrieval = { recommend: jest.fn().mockResolvedValue({ items: [] }) } as unknown as MemoryRetrievalService;
  const entitlementService = { hasPremiumAccess: jest.fn().mockResolvedValue(isPremium) } as unknown as EntitlementService;
  const costControl = { checkBudget: jest.fn().mockResolvedValue({ allowed: true }) };
  const generationLock = { tryAcquireDiscovery: jest.fn().mockResolvedValue(true), releaseDiscovery: jest.fn().mockResolvedValue(undefined) };
  const service = new TarotRecordService(prisma as never, interpretation, memoryRetrieval, entitlementService, costControl as never, generationLock as never);
  return { service, prisma, entitlementService, interpretation, costControl, generationLock };
}

describe('TarotRecordService — ownership', () => {
  it('getOne/history/archive/restore/remove 404 identically for a nonexistent id and another user’s reading', async () => {
    const { service } = makeService([makeReading({ id: 'r1', userId: OTHER })]);
    await expect(service.getOne(OWNER, 'r1')).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.getOne(OWNER, 'does-not-exist')).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.history(OWNER, 'r1')).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.archive(OWNER, 'r1')).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.restore(OWNER, 'r1')).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.remove(OWNER, 'r1')).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('TarotRecordService — lifecycle transitions', () => {
  it('archive only succeeds from ACTIVE', async () => {
    const { service } = makeService([makeReading({ id: 'r1', status: 'ACTIVE' })]);
    const result = await service.archive(OWNER, 'r1');
    expect(result.status).toBe('ARCHIVED');
  });

  it('archive rejects a reading that is already archived', async () => {
    const { service } = makeService([makeReading({ id: 'r1', status: 'ARCHIVED' })]);
    await expect(service.archive(OWNER, 'r1')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('restore is rejected on an already-ACTIVE reading', async () => {
    const { service } = makeService([makeReading({ id: 'r1', status: 'ACTIVE' })]);
    await expect(service.restore(OWNER, 'r1')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('archive then restore returns to ACTIVE', async () => {
    const { service } = makeService([makeReading({ id: 'r1', status: 'ACTIVE' })]);
    await service.archive(OWNER, 'r1');
    const restored = await service.restore(OWNER, 'r1');
    expect(restored.status).toBe('ACTIVE');
  });

  it('remove is rejected on an already-deleted reading', async () => {
    const { service } = makeService([makeReading({ id: 'r1', status: 'DELETED' })]);
    await expect(service.remove(OWNER, 'r1')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('delete then restore returns to ACTIVE', async () => {
    const { service } = makeService([makeReading({ id: 'r1', status: 'ACTIVE' })]);
    await service.remove(OWNER, 'r1');
    const restored = await service.restore(OWNER, 'r1');
    expect(restored.status).toBe('ACTIVE');
  });
});

describe('TarotRecordService — Daily Draw rate limit (Phase 9 security fix)', () => {
  it('a second Daily Draw the same UTC day is rejected even if the first was deleted', async () => {
    const { service, prisma } = makeService([
      makeReading({ id: 'r1', type: 'DAILY_DRAW', status: 'DELETED', createdAt: new Date() }),
    ]);
    // draw() itself needs a real spread/card lookup we haven't mocked here — assert the guard
    // rejects before any of that by checking the thrown error directly.
    await expect(service.draw(OWNER, { type: 'DAILY_DRAW' })).rejects.toMatchObject({
      response: { code: 'TAROT_DAILY_DRAW_ALREADY_TAKEN' },
    });
    expect(prisma.tarotReading.findFirst).toHaveBeenCalled();
  });
});

describe('TarotRecordService — Sprint 7 Free vs Premium daily usage limits', () => {
  function readingsToday(type: string, count: number, ownerOverride = OWNER) {
    return Array.from({ length: count }, (_, i) => makeReading({ id: `${type}-${i}`, type, userId: ownerOverride, createdAt: new Date() }));
  }

  it('a Free user is denied PREMIUM_REQUIRED after 3 Single Card draws today (raising the ceiling would help)', async () => {
    const { service } = makeService(readingsToday('SINGLE_CARD', 3), false);
    await expect(service.draw(OWNER, { type: 'SINGLE_CARD' })).rejects.toMatchObject({ response: { code: 'PREMIUM_REQUIRED' } });
  });

  it('a Free user may still draw a 3rd Single Card (limit not yet reached)', async () => {
    const { service, prisma } = makeService(readingsToday('SINGLE_CARD', 2), false);
    // No spread/card seeded — assert the usage-limit guard itself passes (no PREMIUM_REQUIRED/limit
    // error) by checking draw() gets past assertWithinDailyLimit and fails later on the (unmocked)
    // spread lookup instead.
    await expect(service.draw(OWNER, { type: 'SINGLE_CARD' })).rejects.toMatchObject({ response: { code: 'TAROT_SPREAD_NOT_SEEDED' } });
    expect(prisma.tarotReading.count).toHaveBeenCalled();
  });

  it('a Free user is denied a Three Card Spread after 1 today', async () => {
    const { service } = makeService(readingsToday('THREE_CARD', 1), false);
    await expect(service.draw(OWNER, { type: 'THREE_CARD' })).rejects.toMatchObject({ response: { code: 'PREMIUM_REQUIRED' } });
  });

  it('a Premium user is allowed a 4th Single Card draw the same day (raised ceiling)', async () => {
    const { service } = makeService(readingsToday('SINGLE_CARD', 3), true);
    await expect(service.draw(OWNER, { type: 'SINGLE_CARD' })).rejects.toMatchObject({ response: { code: 'TAROT_SPREAD_NOT_SEEDED' } });
  });

  it('a Premium user hitting their own (higher) Single Card ceiling gets a plain limit error, not PREMIUM_REQUIRED', async () => {
    const { service } = makeService(readingsToday('SINGLE_CARD', 15), true);
    await expect(service.draw(OWNER, { type: 'SINGLE_CARD' })).rejects.toMatchObject({ response: { code: 'TAROT_DAILY_LIMIT_REACHED' } });
  });
});

describe('TarotRecordService — Sprint 7 Free history cap', () => {
  function readings(count: number) {
    return Array.from({ length: count }, (_, i) =>
      makeReading({ id: `r${i}`, userId: OWNER, createdAt: new Date(Date.UTC(2026, 0, 1, 0, 0, i)) }),
    );
  }

  it('a Free user sees at most the most recent 20 readings, total capped at 20', async () => {
    const { service } = makeService(readings(35), false);
    const result = await service.list(OWNER, { page: 1, pageSize: 20 });
    expect(result.items).toHaveLength(20);
    expect(result.total).toBe(20);
  });

  it('a Free user requesting beyond the 20-item window is denied PREMIUM_REQUIRED', async () => {
    const { service } = makeService(readings(35), false);
    await expect(service.list(OWNER, { page: 2, pageSize: 20 })).rejects.toMatchObject({ response: { code: 'PREMIUM_REQUIRED' } });
  });

  it('a Premium user can page past 20 readings normally', async () => {
    const { service } = makeService(readings(35), true);
    const result = await service.list(OWNER, { page: 2, pageSize: 20 });
    expect(result.items).toHaveLength(15);
    expect(result.total).toBe(35);
  });
});

describe('TarotRecordService — Sprint 12 AI cost-control/concurrency parity (retryInterpretation)', () => {
  it('retryInterpretation acquires and releases the Discovery lock scoped to (tarot, user, reading)', async () => {
    const { service, generationLock } = makeService([makeReading({ id: 'r1' })]);
    await service.retryInterpretation(OWNER, 'r1');
    expect(generationLock.tryAcquireDiscovery).toHaveBeenCalledWith('tarot', OWNER, 'r1');
    expect(generationLock.releaseDiscovery).toHaveBeenCalledWith('tarot', OWNER, 'r1');
  });

  it('checks the budget before attempting a generation', async () => {
    const { service, costControl } = makeService([makeReading({ id: 'r1' })]);
    await service.retryInterpretation(OWNER, 'r1');
    expect(costControl.checkBudget).toHaveBeenCalledWith(OWNER);
  });

  it('when the budget is exceeded, retryInterpretation does not throw and never attempts a generation — the reading stays as-is, same UX as any other provider failure', async () => {
    const { service, interpretation, costControl } = makeService([makeReading({ id: 'r1' })]);
    costControl.checkBudget.mockResolvedValue({ allowed: false, reason: 'daily_request_limit', message: 'over budget' });

    const result = await service.retryInterpretation(OWNER, 'r1');

    expect(interpretation.interpret).not.toHaveBeenCalled();
    expect(result.id).toBe('r1');
  });

  it('when the Discovery lock is already held (concurrent retry in flight), retryInterpretation does not throw and never attempts a second generation', async () => {
    const { service, interpretation, generationLock } = makeService([makeReading({ id: 'r1' })]);
    generationLock.tryAcquireDiscovery.mockResolvedValue(false);

    const result = await service.retryInterpretation(OWNER, 'r1');

    expect(interpretation.interpret).not.toHaveBeenCalled();
    expect(generationLock.releaseDiscovery).not.toHaveBeenCalled(); // nothing was acquired, nothing to release
    expect(result.id).toBe('r1');
  });

  it('the lock is released even when interpret() throws', async () => {
    const { service, interpretation, generationLock } = makeService([makeReading({ id: 'r1' })]);
    (interpretation.interpret as jest.Mock).mockRejectedValue(new Error('provider exploded'));

    await service.retryInterpretation(OWNER, 'r1');

    expect(generationLock.releaseDiscovery).toHaveBeenCalledWith('tarot', OWNER, 'r1');
  });

  it('passes { userId, sourceId } attribution through to interpret()', async () => {
    const { service, interpretation } = makeService([makeReading({ id: 'r1' })]);
    await service.retryInterpretation(OWNER, 'r1');
    expect(interpretation.interpret).toHaveBeenCalledWith(expect.anything(), { userId: OWNER, sourceId: 'r1' });
  });
});
