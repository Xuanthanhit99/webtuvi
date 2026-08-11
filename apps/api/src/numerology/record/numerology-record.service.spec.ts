import { BadRequestException, NotFoundException } from '@nestjs/common';
import { NumerologyRecordService } from './numerology-record.service';
import type { NumerologyInterpretationService } from '../interpretation/numerology-interpretation.service';
import type { MemoryRetrievalService } from '../../memory/retrieval/memory-retrieval.service';
import type { EntitlementService } from '../../payment/entitlement/entitlement.service';

const OWNER = 'user-1';
const OTHER = 'user-2';

interface ReadingRow {
  id: string;
  userId: string;
  status: string;
  visibility: string;
  birthNameInput: string;
  normalizedBirthName: string;
  birthDate: Date;
  calculationVersion: string;
  normalizationVersion: string;
  interpretation: string | null;
  createdAt: Date;
  updatedAt: Date;
  archivedAt: Date | null;
  deletedAt: Date | null;
}

interface ValueRow {
  id: string;
  readingId: string;
  type: string;
  value: number;
  isMasterNumber: boolean;
  breakdown: unknown;
  appliesToYear: number | null;
  order: number;
}

interface HistoryRow {
  id: string;
  readingId: string;
  action: string;
  detail: string;
  createdAt: Date;
}

interface ReadingWhere {
  userId?: string;
  status?: string | { not: string };
  createdAt?: { gte: Date };
}

function makeReading(overrides: Partial<ReadingRow> & { id?: string } = {}): ReadingRow {
  return {
    id: overrides.id ?? 'reading-1',
    userId: overrides.userId ?? OWNER,
    status: overrides.status ?? 'ACTIVE',
    visibility: overrides.visibility ?? 'COMPANION_VISIBLE',
    birthNameInput: overrides.birthNameInput ?? 'Jane Doe',
    normalizedBirthName: overrides.normalizedBirthName ?? 'JANE DOE',
    birthDate: overrides.birthDate ?? new Date('1990-01-01T00:00:00.000Z'),
    calculationVersion: overrides.calculationVersion ?? 'numerology-pythagorean-v1',
    normalizationVersion: overrides.normalizationVersion ?? 'numerology-name-normalization-v1',
    interpretation: overrides.interpretation ?? null,
    createdAt: overrides.createdAt ?? new Date('2026-01-05T00:00:00.000Z'),
    updatedAt: overrides.updatedAt ?? new Date('2026-01-05T00:00:00.000Z'),
    archivedAt: overrides.archivedAt ?? null,
    deletedAt: overrides.deletedAt ?? null,
  };
}

function matchesWhere(row: ReadingRow, where: ReadingWhere = {}): boolean {
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

function makePrismaMock(seed: ReadingRow[] = []) {
  const rows = new Map(seed.map((r) => [r.id, r]));
  const valuesByReading = new Map<string, ValueRow[]>();
  const history: HistoryRow[] = [];
  let readingCounter = 0;
  let valueCounter = 0;
  let historyCounter = 0;

  function withValues(row: ReadingRow) {
    return { ...row, values: valuesByReading.get(row.id) ?? [] };
  }

  type CreateReadingData = Pick<
    ReadingRow,
    'userId' | 'birthNameInput' | 'normalizedBirthName' | 'birthDate' | 'calculationVersion' | 'normalizationVersion' | 'visibility'
  > &
    Partial<Pick<ReadingRow, 'status' | 'archivedAt' | 'deletedAt' | 'interpretation' | 'createdAt' | 'updatedAt'>>;

  const client: Record<string, unknown> = {
    numerologyReading: {
      create: jest.fn(async ({ data }: { data: CreateReadingData }) => {
        const id = `reading-${readingCounter++}`;
        const row: ReadingRow = {
          status: 'ACTIVE',
          archivedAt: null,
          deletedAt: null,
          interpretation: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data,
          id,
        };
        rows.set(id, row);
        valuesByReading.set(id, []);
        return row;
      }),
      findUnique: jest.fn(async ({ where: { id } }: { where: { id: string } }) => {
        const row = rows.get(id);
        return row ? withValues(row) : null;
      }),
      findUniqueOrThrow: jest.fn(async ({ where: { id } }: { where: { id: string } }) => {
        const row = rows.get(id);
        if (!row) throw new Error('not found');
        return withValues(row);
      }),
      findFirst: jest.fn(async ({ where }: { where: ReadingWhere }) => {
        const row = [...rows.values()].find((r) => matchesWhere(r, where));
        return row ? withValues(row) : null;
      }),
      count: jest.fn(async ({ where }: { where?: ReadingWhere } = {}) => [...rows.values()].filter((r) => matchesWhere(r, where)).length),
      findMany: jest.fn(
        async ({
          where,
          orderBy,
          skip,
          take,
        }: { where?: ReadingWhere; orderBy?: { createdAt?: 'asc' | 'desc' }; skip?: number; take?: number } = {}) => {
          let result = [...rows.values()].filter((r) => matchesWhere(r, where));
          if (orderBy?.createdAt === 'desc') result = result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
          if (typeof skip === 'number') result = result.slice(skip);
          if (typeof take === 'number') result = result.slice(0, take);
          return result.map(withValues);
        },
      ),
      update: jest.fn(async ({ where: { id }, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        const existing = rows.get(id)!;
        const updated = { ...existing, ...data } as ReadingRow;
        rows.set(id, updated);
        return withValues(updated);
      }),
    },
    numerologyValue: {
      createMany: jest.fn(async ({ data }: { data: Omit<ValueRow, 'id'>[] }) => {
        for (const entry of data) {
          const id = `value-${valueCounter++}`;
          const arr = valuesByReading.get(entry.readingId) ?? [];
          arr.push({ id, ...entry });
          valuesByReading.set(entry.readingId, arr);
        }
        return { count: data.length };
      }),
    },
    numerologyReadingHistory: {
      create: jest.fn(async ({ data }: { data: { readingId: string; action: string; detail: string } }) => {
        const entry: HistoryRow = { id: `h${historyCounter++}`, ...data, createdAt: new Date() };
        history.push(entry);
        return entry;
      }),
      findMany: jest.fn(async ({ where: { readingId } }: { where: { readingId: string } }) => history.filter((h) => h.readingId === readingId)),
    },
    $transaction: jest.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn(client)),
  };

  return client;
}

function makeService(seed: ReadingRow[] = [], isPremium = false, interpretResult: string | null = null) {
  const prisma = makePrismaMock(seed);
  const interpretation = { interpret: jest.fn().mockResolvedValue(interpretResult) } as unknown as NumerologyInterpretationService;
  const memoryRetrieval = { recommend: jest.fn().mockResolvedValue({ items: [] }) } as unknown as MemoryRetrievalService;
  const entitlementService = { hasPremiumAccess: jest.fn().mockResolvedValue(isPremium) } as unknown as EntitlementService;
  const service = new NumerologyRecordService(prisma as never, interpretation, memoryRetrieval, entitlementService);
  return { service, prisma, entitlementService, interpretation };
}

describe('NumerologyRecordService — calculate() persists the real deterministic result', () => {
  it('persists all six core numbers exactly matching the engine’s output for a known golden vector', async () => {
    const { service } = makeService();
    const reading = await service.calculate(OWNER, { fullBirthName: 'Nguyen Van A', birthDate: '1995-08-17' });

    expect(reading.normalizedBirthName).toBe('NGUYEN VAN A');
    expect(reading.birthDate).toBe('1995-08-17');
    expect(reading.values).toHaveLength(6);

    const byType = Object.fromEntries(reading.values.map((v) => [v.type, v]));
    expect(byType['LIFE_PATH']!.value).toBe(22);
    expect(byType['LIFE_PATH']!.isMasterNumber).toBe(true);
    expect(byType['PERSONALITY']!.value).toBe(33);
    expect(byType['PERSONALITY']!.isMasterNumber).toBe(true);
    expect(byType['EXPRESSION']!.value).toBe(7);
    expect(byType['BIRTHDAY']!.value).toBe(8);
  });

  it('rejects an invalid birth date with a normalized BadRequestException, and creates no reading', async () => {
    const { service, prisma } = makeService();
    await expect(service.calculate(OWNER, { fullBirthName: 'Jane Doe', birthDate: '2099-01-01' })).rejects.toBeInstanceOf(BadRequestException);
    expect((prisma.numerologyReading as { create: jest.Mock }).create).not.toHaveBeenCalled();
  });

  it('rejects a name with no transliterable letters with a normalized BadRequestException', async () => {
    const { service } = makeService();
    await expect(service.calculate(OWNER, { fullBirthName: '田中太郎', birthDate: '1990-01-01' })).rejects.toMatchObject({
      response: { code: 'NUMEROLOGY_NAME_TRANSLITERATION_UNSUPPORTED' },
    });
  });

  it('attempts interpretation after persisting, and a null interpretation leaves the reading valid with interpretation: null', async () => {
    const { service } = makeService([], false, null);
    const reading = await service.calculate(OWNER, { fullBirthName: 'Jane Doe', birthDate: '1990-01-01' });
    expect(reading.interpretation).toBeNull();
    expect(reading.values).toHaveLength(6);
  });

  it('a successful interpretation is persisted onto the reading', async () => {
    const { service } = makeService([], false, 'A grounded reflection.');
    const reading = await service.calculate(OWNER, { fullBirthName: 'Jane Doe', birthDate: '1990-01-01' });
    expect(reading.interpretation).toBe('A grounded reflection.');
  });
});

describe('NumerologyRecordService — ownership', () => {
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

describe('NumerologyRecordService — lifecycle transitions', () => {
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

describe('NumerologyRecordService — daily calculation ceiling (anti-abuse, not a content gate)', () => {
  function calculationsToday(count: number) {
    return Array.from({ length: count }, (_, i) => makeReading({ id: `r${i}`, createdAt: new Date() }));
  }

  it('is status-agnostic, mirroring Tarot’s own Phase 9 security fix — deleted readings still count toward today’s total', async () => {
    const { service } = makeService(calculationsToday(5).map((r) => ({ ...r, status: 'DELETED' })), false);
    await expect(service.calculate(OWNER, { fullBirthName: 'Jane Doe', birthDate: '1990-01-01' })).rejects.toMatchObject({
      response: { code: 'PREMIUM_REQUIRED' },
    });
  });

  it('a Free user is denied PREMIUM_REQUIRED after 5 calculations today (raising the ceiling would help)', async () => {
    const { service } = makeService(calculationsToday(5), false);
    await expect(service.calculate(OWNER, { fullBirthName: 'Jane Doe', birthDate: '1990-01-01' })).rejects.toMatchObject({
      response: { code: 'PREMIUM_REQUIRED' },
    });
  });

  it('a Free user may still calculate a 5th reading (limit not yet reached)', async () => {
    const { service } = makeService(calculationsToday(4), false);
    const reading = await service.calculate(OWNER, { fullBirthName: 'Jane Doe', birthDate: '1990-01-01' });
    expect(reading.values).toHaveLength(6);
  });

  it('a Premium user is allowed a 6th calculation the same day (raised ceiling)', async () => {
    const { service } = makeService(calculationsToday(5), true);
    const reading = await service.calculate(OWNER, { fullBirthName: 'Jane Doe', birthDate: '1990-01-01' });
    expect(reading.values).toHaveLength(6);
  });

  it('a Premium user hitting their own (higher) ceiling gets a plain limit error, not PREMIUM_REQUIRED', async () => {
    const { service } = makeService(calculationsToday(15), true);
    await expect(service.calculate(OWNER, { fullBirthName: 'Jane Doe', birthDate: '1990-01-01' })).rejects.toMatchObject({
      response: { code: 'NUMEROLOGY_DAILY_LIMIT_REACHED' },
    });
  });
});

describe('NumerologyRecordService — Free history cap', () => {
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
