import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { TuViRecordService } from './tu-vi-record.service';
import type { EntitlementService } from '../../payment/entitlement/entitlement.service';
import type { AnalyticsService } from '../../analytics/analytics.service';

const OWNER = 'user-1';
const OTHER = 'user-2';

interface ChartRow {
  id: string;
  userId: string;
  status: string;
  birthDate: Date;
  birthTime: string;
  sex: string;
  engineVersion: string;
  calendarVersion: string;
  rulesetVersion: string;
  mainStarVersion: string;
  auxiliaryVersion: string;
  tuanTrietVersion: string;
  tuHoaVersion: string;
  lunarYear: number;
  lunarMonth: number;
  lunarDay: number;
  isLeapMonth: boolean;
  hourBranch: string;
  yearStem: string;
  yearBranch: string;
  menhPosition: string;
  thanPosition: string;
  cuc: string;
  palaceLayout: object;
  mainStars: object;
  auxiliaryStars: object;
  tuan: object;
  triet: object;
  transformations: object;
  interpretation: string | null;
  aiProvider: string | null;
  aiModel: string | null;
  promptVersion: string | null;
  interpretedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  archivedAt: Date | null;
  deletedAt: Date | null;
}

interface HistoryRow {
  id: string;
  chartId: string;
  action: string;
  detail: string;
  createdAt: Date;
}

interface ChartWhere {
  userId?: string;
  status?: string | { not: string };
  createdAt?: { gte: Date };
}

function matchesWhere(row: ChartRow, where: ChartWhere = {}): boolean {
  if (where.userId !== undefined && row.userId !== where.userId) return false;
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

function makePrismaMock(seed: ChartRow[] = []) {
  const rows = new Map(seed.map((r) => [r.id, r]));
  const history: HistoryRow[] = [];
  let chartCounter = 0;
  let historyCounter = 0;

  const client: Record<string, unknown> = {
    tuViChart: {
      create: jest.fn(async ({ data }: { data: Partial<ChartRow> & { userId: string } }) => {
        const id = `chart-${chartCounter++}`;
        const row = {
          id,
          status: 'ACTIVE',
          interpretation: null,
          aiProvider: null,
          aiModel: null,
          promptVersion: null,
          interpretedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          archivedAt: null,
          deletedAt: null,
          ...data,
        } as ChartRow;
        rows.set(id, row);
        return row;
      }),
      findUnique: jest.fn(async ({ where }: { where: { id: string } }) => rows.get(where.id) ?? null),
      findUniqueOrThrow: jest.fn(async ({ where }: { where: { id: string } }) => {
        const row = rows.get(where.id);
        if (!row) throw new Error('not found');
        return row;
      }),
      findMany: jest.fn(async ({ where, orderBy, skip, take }: { where?: ChartWhere; orderBy?: { createdAt: 'asc' | 'desc' }; skip?: number; take?: number }) => {
        let result = [...rows.values()].filter((r) => matchesWhere(r, where));
        if (orderBy?.createdAt === 'desc') result = result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        if (skip) result = result.slice(skip);
        if (take !== undefined) result = result.slice(0, take);
        return result;
      }),
      count: jest.fn(async ({ where }: { where?: ChartWhere }) => [...rows.values()].filter((r) => matchesWhere(r, where)).length),
      update: jest.fn(async ({ where, data }: { where: { id: string }; data: Partial<ChartRow> }) => {
        const row = rows.get(where.id);
        if (!row) throw new Error('not found');
        Object.assign(row, data);
        return row;
      }),
    },
    tuViChartHistory: {
      create: jest.fn(async ({ data }: { data: Omit<HistoryRow, 'id' | 'createdAt'> }) => {
        const row: HistoryRow = { id: `history-${historyCounter++}`, createdAt: new Date(), ...data };
        history.push(row);
        return row;
      }),
      findMany: jest.fn(async ({ where }: { where: { chartId: string } }) => history.filter((h) => h.chartId === where.chartId)),
    },
    $transaction: jest.fn(async (fn: (tx: typeof client) => Promise<unknown>) => fn(client)),
  };
  return client;
}

function makeService(prisma: ReturnType<typeof makePrismaMock>, isPremium = false) {
  const entitlementService = { hasPremiumAccess: jest.fn(async () => isPremium) } as unknown as EntitlementService;
  const analyticsService = { trackServerEvent: jest.fn(async () => undefined) } as unknown as AnalyticsService;
  // Interpretation is deliberately mocked to never actually call a provider in these
  // persistence/lifecycle unit tests — that behavior is covered separately in
  // tu-vi-interpretation.service.spec.ts and the e2e suite's own interpretation block.
  const interpretationService = { interpret: jest.fn(async () => null) };
  const memoryRetrieval = { recommend: jest.fn(async () => ({ items: [] })) };
  const costControl = { checkBudget: jest.fn(async () => ({ allowed: true })), record: jest.fn(async () => 0) };
  const generationLock = { tryAcquireDiscovery: jest.fn(async () => true), releaseDiscovery: jest.fn(async () => undefined) };
  const service = new TuViRecordService(
    prisma as never,
    interpretationService as never,
    memoryRetrieval as never,
    entitlementService,
    costControl as never,
    generationLock as never,
    analyticsService,
  );
  return { service, entitlementService, analyticsService, interpretationService, generationLock };
}

const VALID_INPUT = { birthDate: '2024-02-10', birthTime: '10:30', sex: 'Nam' as const };

describe('TuViRecordService.calculate', () => {
  it('persists a chart and returns it with interpretation: null (AI wired in 18B.10, not this phase)', async () => {
    const prisma = makePrismaMock();
    const { service } = makeService(prisma);
    const result = await service.calculate(OWNER, VALID_INPUT);
    expect(result.cuc).toBe('Kim Tứ Cục');
    expect(result.interpretation).toBeNull();
    expect(result.mainStars).toHaveLength(14);
    expect(result.auxiliaryStars).toHaveLength(13);
  });

  it('records a CREATED history entry', async () => {
    const prisma = makePrismaMock();
    const { service } = makeService(prisma);
    const result = await service.calculate(OWNER, VALID_INPUT);
    const history = await service.history(OWNER, result.id);
    expect(history.map((h) => h.action)).toContain('CREATED');
  });

  it('tracks the tu_vi_completed analytics event with only the bounded feature property', async () => {
    const prisma = makePrismaMock();
    const { service, analyticsService } = makeService(prisma);
    await service.calculate(OWNER, VALID_INPUT);
    expect(analyticsService.trackServerEvent).toHaveBeenCalledWith(expect.objectContaining({ event: 'tu_vi_completed', properties: { feature: 'tu_vi' } }));
  });

  it('maps an invalid birth date to BadRequestException, not an unhandled 500', async () => {
    const prisma = makePrismaMock();
    const { service } = makeService(prisma);
    await expect(service.calculate(OWNER, { birthDate: '2025-02-31', birthTime: '10:00', sex: 'Nam' })).rejects.toThrow(BadRequestException);
  });

  it('enforces the free daily calculation limit (5/day)', async () => {
    const prisma = makePrismaMock();
    const { service } = makeService(prisma, false);
    for (let i = 0; i < 5; i++) {
      await service.calculate(OWNER, VALID_INPUT);
    }
    await expect(service.calculate(OWNER, VALID_INPUT)).rejects.toThrow(ForbiddenException);
  });

  it('premium users get a higher daily ceiling (15/day)', async () => {
    const prisma = makePrismaMock();
    const { service } = makeService(prisma, true);
    for (let i = 0; i < 15; i++) {
      await service.calculate(OWNER, VALID_INPUT);
    }
    await expect(service.calculate(OWNER, VALID_INPUT)).rejects.toThrow(BadRequestException);
  });
});

describe('TuViRecordService — ownership (IDOR prevention)', () => {
  it('getOne 404s identically for a nonexistent id and one owned by a different user', async () => {
    const prisma = makePrismaMock();
    const { service } = makeService(prisma);
    const created = await service.calculate(OWNER, VALID_INPUT);

    let crossUserError: unknown;
    try {
      await service.getOne(OTHER, created.id);
    } catch (e) {
      crossUserError = e;
    }
    let nonExistentError: unknown;
    try {
      await service.getOne(OTHER, 'does-not-exist');
    } catch (e) {
      nonExistentError = e;
    }
    expect(crossUserError).toBeInstanceOf(NotFoundException);
    expect(nonExistentError).toBeInstanceOf(NotFoundException);
    expect((crossUserError as NotFoundException).getResponse()).toEqual((nonExistentError as NotFoundException).getResponse());
  });

  it('a different user cannot archive, restore, or delete another user\'s chart', async () => {
    const prisma = makePrismaMock();
    const { service } = makeService(prisma);
    const created = await service.calculate(OWNER, VALID_INPUT);

    await expect(service.archive(OTHER, created.id)).rejects.toThrow(NotFoundException);
    await expect(service.restore(OTHER, created.id)).rejects.toThrow(NotFoundException);
    await expect(service.remove(OTHER, created.id)).rejects.toThrow(NotFoundException);
    await expect(service.history(OTHER, created.id)).rejects.toThrow(NotFoundException);
  });

  it('list() never includes another user\'s charts, even when explicitly queried', async () => {
    const prisma = makePrismaMock();
    const { service } = makeService(prisma);
    await service.calculate(OWNER, VALID_INPUT);
    await service.calculate(OTHER, VALID_INPUT);

    const ownerList = await service.list(OWNER, {});
    expect(ownerList.items).toHaveLength(1);
    expect(ownerList.total).toBe(1);
  });
});

describe('TuViRecordService — lifecycle transitions', () => {
  it('archive -> restore round trip', async () => {
    const prisma = makePrismaMock();
    const { service } = makeService(prisma);
    const created = await service.calculate(OWNER, VALID_INPUT);
    const archived = await service.archive(OWNER, created.id);
    expect(archived.status).toBe('ARCHIVED');
    const restored = await service.restore(OWNER, created.id);
    expect(restored.status).toBe('ACTIVE');
  });

  it('rejects archiving an already-archived chart', async () => {
    const prisma = makePrismaMock();
    const { service } = makeService(prisma);
    const created = await service.calculate(OWNER, VALID_INPUT);
    await service.archive(OWNER, created.id);
    await expect(service.archive(OWNER, created.id)).rejects.toThrow(BadRequestException);
  });

  it('remove() soft-deletes (reversible via restore)', async () => {
    const prisma = makePrismaMock();
    const { service } = makeService(prisma);
    const created = await service.calculate(OWNER, VALID_INPUT);
    const removed = await service.remove(OWNER, created.id);
    expect(removed.status).toBe('DELETED');
    const restored = await service.restore(OWNER, created.id);
    expect(restored.status).toBe('ACTIVE');
  });
});

describe('TuViRecordService — free history limit', () => {
  it('free users cannot page past the 20-chart free history limit', async () => {
    const prisma = makePrismaMock();
    const { service } = makeService(prisma, false);
    await expect(service.list(OWNER, { page: 2, pageSize: 20 })).rejects.toThrow(ForbiddenException);
  });

  it('premium users have no such limit', async () => {
    const prisma = makePrismaMock();
    const { service } = makeService(prisma, true);
    await expect(service.list(OWNER, { page: 2, pageSize: 20 })).resolves.toBeDefined();
  });
});

describe('TuViRecordService — AI interpretation (Sprint 18B.10, best-effort)', () => {
  it('calculate() calls interpret() and persists the result when the provider succeeds', async () => {
    const prisma = makePrismaMock();
    const { service, interpretationService } = makeService(prisma);
    (interpretationService.interpret as jest.Mock).mockResolvedValueOnce('A grounded reflection on this chart.');
    const result = await service.calculate(OWNER, VALID_INPUT);
    expect(result.interpretation).toBe('A grounded reflection on this chart.');
    const history = await service.history(OWNER, result.id);
    expect(history.map((h) => h.action)).toContain('INTERPRETED');
  });

  it('a provider failure (interpret() returns null) leaves interpretation: null WITHOUT throwing — the deterministic chart is still fully persisted and returned', async () => {
    const prisma = makePrismaMock();
    const { service, interpretationService } = makeService(prisma);
    (interpretationService.interpret as jest.Mock).mockResolvedValueOnce(null);
    const result = await service.calculate(OWNER, VALID_INPUT);
    expect(result.interpretation).toBeNull();
    expect(result.cuc).toBe('Kim Tứ Cục'); // deterministic facts unaffected by the AI failure
  });

  it('the generation lock is always released, even when interpret() throws', async () => {
    const prisma = makePrismaMock();
    const { service, interpretationService, generationLock } = makeService(prisma);
    (interpretationService.interpret as jest.Mock).mockRejectedValueOnce(new Error('provider exploded'));
    const result = await service.calculate(OWNER, VALID_INPUT);
    expect(result.interpretation).toBeNull(); // never throws out to the caller
    expect(generationLock.releaseDiscovery).toHaveBeenCalledWith('tu_vi', OWNER, result.id);
  });

  it('retryInterpretation() is owner-scoped like every other lifecycle action', async () => {
    const prisma = makePrismaMock();
    const { service } = makeService(prisma);
    const created = await service.calculate(OWNER, VALID_INPUT);
    await expect(service.retryInterpretation(OTHER, created.id)).rejects.toThrow(NotFoundException);
  });

  it('retryInterpretation() does not regenerate if an interpretation already exists', async () => {
    const prisma = makePrismaMock();
    const { service, interpretationService } = makeService(prisma);
    (interpretationService.interpret as jest.Mock).mockResolvedValueOnce('First interpretation.');
    const created = await service.calculate(OWNER, VALID_INPUT);
    expect(created.interpretation).toBe('First interpretation.');

    (interpretationService.interpret as jest.Mock).mockResolvedValueOnce('Should not be used.');
    const retried = await service.retryInterpretation(OWNER, created.id);
    expect(retried.interpretation).toBe('First interpretation.');
  });
});
