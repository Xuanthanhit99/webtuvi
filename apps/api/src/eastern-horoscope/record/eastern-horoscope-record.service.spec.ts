import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { EasternHoroscopeRecordService } from './eastern-horoscope-record.service';
import type { EasternHoroscopeInterpretationService } from '../interpretation/eastern-horoscope-interpretation.service';
import type { MemoryRetrievalService } from '../../memory/retrieval/memory-retrieval.service';
import type { EntitlementService } from '../../payment/entitlement/entitlement.service';

const OWNER = 'user-1';
const OTHER = 'user-2';

interface ProfileRow {
  id: string;
  userId: string;
  status: string;
  birthDate: Date;
  engineVersion: string;
  calendarVersion: string;
  rulesetVersion: string;
  stem: string;
  branch: string;
  element: string;
  yinYang: string;
  zodiacAnimalEn: string;
  zodiacAnimalVi: string;
  interpretation: string | null;
  interpretationYear: number | null;
  interpretedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  archivedAt: Date | null;
  deletedAt: Date | null;
}

interface HistoryRow {
  id: string;
  profileId: string;
  action: string;
  detail: string;
  createdAt: Date;
}

interface ProfileWhere {
  userId?: string;
  status?: string | { not: string };
  createdAt?: { gte: Date };
}

function matchesWhere(row: ProfileRow, where: ProfileWhere = {}): boolean {
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

function makePrismaMock(seed: ProfileRow[] = []) {
  const rows = new Map(seed.map((r) => [r.id, r]));
  const history: HistoryRow[] = [];
  let profileCounter = 0;
  let historyCounter = 0;

  const client: Record<string, unknown> = {
    easternHoroscopeProfile: {
      create: jest.fn(async ({ data }: { data: Partial<ProfileRow> }) => {
        const id = `profile-${profileCounter++}`;
        const row: ProfileRow = {
          status: 'ACTIVE',
          interpretation: null,
          interpretationYear: null,
          interpretedAt: null,
          archivedAt: null,
          deletedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data,
          id,
        } as ProfileRow;
        rows.set(id, row);
        return row;
      }),
      findUnique: jest.fn(async ({ where: { id } }: { where: { id: string } }) => rows.get(id) ?? null),
      findUniqueOrThrow: jest.fn(async ({ where: { id } }: { where: { id: string } }) => {
        const row = rows.get(id);
        if (!row) throw new Error('not found');
        return row;
      }),
      count: jest.fn(async ({ where }: { where?: ProfileWhere } = {}) => [...rows.values()].filter((r) => matchesWhere(r, where)).length),
      findMany: jest.fn(
        async ({ where, orderBy, skip, take }: { where?: ProfileWhere; orderBy?: { createdAt?: 'asc' | 'desc' }; skip?: number; take?: number } = {}) => {
          let result = [...rows.values()].filter((r) => matchesWhere(r, where));
          if (orderBy?.createdAt === 'desc') result = result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
          if (typeof skip === 'number') result = result.slice(skip);
          if (typeof take === 'number') result = result.slice(0, take);
          return result;
        },
      ),
      update: jest.fn(async ({ where: { id }, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        const existing = rows.get(id)!;
        const updated = { ...existing, ...data } as ProfileRow;
        rows.set(id, updated);
        return updated;
      }),
    },
    easternHoroscopeProfileHistory: {
      create: jest.fn(async ({ data }: { data: { profileId: string; action: string; detail: string } }) => {
        const entry: HistoryRow = { id: `h${historyCounter++}`, ...data, createdAt: new Date() };
        history.push(entry);
        return entry;
      }),
      findMany: jest.fn(async ({ where: { profileId } }: { where: { profileId: string } }) => history.filter((h) => h.profileId === profileId)),
    },
    $transaction: jest.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn(client)),
  };

  return client;
}

function makeService(seed: ProfileRow[] = [], isPremium = false, interpretResult: string | null = null) {
  const prisma = makePrismaMock(seed);
  const interpretation = { interpret: jest.fn().mockResolvedValue(interpretResult) } as unknown as EasternHoroscopeInterpretationService;
  const memoryRetrieval = { recommend: jest.fn().mockResolvedValue({ items: [] }) } as unknown as MemoryRetrievalService;
  const entitlementService = { hasPremiumAccess: jest.fn().mockResolvedValue(isPremium) } as unknown as EntitlementService;
  const costControl = { checkBudget: jest.fn().mockResolvedValue({ allowed: true }) };
  const generationLock = { tryAcquireDiscovery: jest.fn().mockResolvedValue(true), releaseDiscovery: jest.fn().mockResolvedValue(undefined) };
  const analyticsService = { trackServerEvent: jest.fn().mockResolvedValue(undefined) };
  const service = new EasternHoroscopeRecordService(
    prisma as never,
    interpretation,
    memoryRetrieval,
    entitlementService,
    costControl as never,
    generationLock as never,
    analyticsService as never,
  );
  return { service, prisma, entitlementService, interpretation, costControl, generationLock, analyticsService };
}

describe('EasternHoroscopeRecordService — calculate() persists the real deterministic result', () => {
  it('persists the exact Stem/Branch/Element/Yin-Yang/animal for a known golden vector (Giáp Thìn / Dragon / Wood / Yang)', async () => {
    const { service } = makeService();
    const profile = await service.calculate(OWNER, { birthDate: '2024-03-01' });

    expect(profile.birthDate).toBe('2024-03-01');
    expect(profile.stem).toBe('Giáp');
    expect(profile.branch).toBe('Thìn');
    expect(profile.element).toBe('Mộc');
    expect(profile.yinYang).toBe('Dương');
    expect(profile.zodiacAnimal).toEqual({ vi: 'Rồng', en: 'Dragon' });
  });

  it('always computes Year Energy fresh against the current calendar year, never persisting it as a frozen fact', async () => {
    const { service } = makeService();
    const profile = await service.calculate(OWNER, { birthDate: '2024-03-01' });
    expect(profile.yearEnergy.calendarYear).toBeGreaterThanOrEqual(2024);
  });

  it('throws BadRequestException for an invalid birth date rather than persisting a guessed result', async () => {
    const { service, prisma } = makeService();
    await expect(service.calculate(OWNER, { birthDate: 'not-a-date' })).rejects.toThrow(BadRequestException);
    expect((prisma.easternHoroscopeProfile as { create: jest.Mock }).create).not.toHaveBeenCalled();
  });

  it('records CREATED history and fires the eastern_horoscope_completed server analytics event', async () => {
    const { service, prisma, analyticsService } = makeService();
    const profile = await service.calculate(OWNER, { birthDate: '2024-03-01' });
    const historyRows = await (prisma.easternHoroscopeProfileHistory as { findMany: (args: unknown) => Promise<HistoryRow[]> }).findMany({
      where: { profileId: profile.id },
    });
    expect(historyRows.some((h) => h.action === 'CREATED')).toBe(true);
    expect(analyticsService.trackServerEvent).toHaveBeenCalledWith(expect.objectContaining({ event: 'eastern_horoscope_completed', userId: OWNER }));
  });

  it('attempts interpretation best-effort — a provider failure never invalidates the already-real calculated result', async () => {
    const { service } = makeService([], false, null); // interpret() resolves to null
    const profile = await service.calculate(OWNER, { birthDate: '2024-03-01' });
    expect(profile.interpretation).toBeNull();
    expect(profile.stem).toBe('Giáp'); // the real result is still there
  });

  it('skips interpretation without throwing when the AI budget is exhausted', async () => {
    const { service, costControl } = makeService();
    costControl.checkBudget.mockResolvedValue({ allowed: false, reason: 'daily_request_limit' });
    const profile = await service.calculate(OWNER, { birthDate: '2024-03-01' });
    expect(profile.interpretation).toBeNull();
  });

  it('skips interpretation without throwing when a concurrent generation is already in flight', async () => {
    const { service, generationLock } = makeService();
    generationLock.tryAcquireDiscovery.mockResolvedValue(false);
    const profile = await service.calculate(OWNER, { birthDate: '2024-03-01' });
    expect(profile.interpretation).toBeNull();
  });

  it('always releases the generation lock, even when interpretation succeeds', async () => {
    const { service, generationLock } = makeService([], false, 'A real reflection.');
    await service.calculate(OWNER, { birthDate: '2024-03-01' });
    expect(generationLock.releaseDiscovery).toHaveBeenCalled();
  });
});

describe('EasternHoroscopeRecordService — daily calculation limit (anti-abuse, not a content gate)', () => {
  it('allows up to 5 calculations/day for a Free user, then requires Premium', async () => {
    const { service } = makeService();
    for (let i = 0; i < 5; i++) {
      await service.calculate(OWNER, { birthDate: '2024-03-01' });
    }
    await expect(service.calculate(OWNER, { birthDate: '2024-03-01' })).rejects.toThrow(ForbiddenException);
  });

  it('allows up to 15 calculations/day for a Premium user, then a plain daily-limit error (not Premium-required)', async () => {
    const { service } = makeService([], true);
    for (let i = 0; i < 15; i++) {
      await service.calculate(OWNER, { birthDate: '2024-03-01' });
    }
    await expect(service.calculate(OWNER, { birthDate: '2024-03-01' })).rejects.toThrow(BadRequestException);
  });
});

describe('EasternHoroscopeRecordService — ownership (IDOR prevention)', () => {
  it('404s identically for a profile that does not exist and one owned by a different user', async () => {
    const { service } = makeService();
    const profile = await service.calculate(OTHER, { birthDate: '2024-03-01' });

    await expect(service.getOne(OWNER, profile.id)).rejects.toThrow(NotFoundException);
    await expect(service.getOne(OWNER, 'nonexistent')).rejects.toThrow(NotFoundException);
  });

  it('a different user cannot archive/restore/delete another user’s profile', async () => {
    const { service } = makeService();
    const profile = await service.calculate(OTHER, { birthDate: '2024-03-01' });

    await expect(service.archive(OWNER, profile.id)).rejects.toThrow(NotFoundException);
    await expect(service.remove(OWNER, profile.id)).rejects.toThrow(NotFoundException);
  });
});

describe('EasternHoroscopeRecordService — lifecycle', () => {
  it('archive -> restore is reversible', async () => {
    const { service } = makeService();
    const profile = await service.calculate(OWNER, { birthDate: '2024-03-01' });

    const archived = await service.archive(OWNER, profile.id);
    expect(archived.status).toBe('ARCHIVED');

    const restored = await service.restore(OWNER, profile.id);
    expect(restored.status).toBe('ACTIVE');
  });

  it('rejects archiving an already-archived profile', async () => {
    const { service } = makeService();
    const profile = await service.calculate(OWNER, { birthDate: '2024-03-01' });
    await service.archive(OWNER, profile.id);
    await expect(service.archive(OWNER, profile.id)).rejects.toThrow(BadRequestException);
  });

  it('soft-delete is reversible via restore', async () => {
    const { service } = makeService();
    const profile = await service.calculate(OWNER, { birthDate: '2024-03-01' });
    const deleted = await service.remove(OWNER, profile.id);
    expect(deleted.status).toBe('DELETED');
    const restored = await service.restore(OWNER, profile.id);
    expect(restored.status).toBe('ACTIVE');
  });
});

describe('EasternHoroscopeRecordService — Premium history cap', () => {
  it('Free accounts cannot page past the first 20 profiles', async () => {
    const { service } = makeService();
    for (let i = 0; i < 5; i++) await service.calculate(OWNER, { birthDate: '2024-03-01' });
    await expect(service.list(OWNER, { page: 2, pageSize: 20 })).rejects.toThrow(ForbiddenException);
  });

  it('Premium accounts can page past 20 profiles', async () => {
    const { service } = makeService([], true);
    for (let i = 0; i < 5; i++) await service.calculate(OWNER, { birthDate: '2024-03-01' });
    const result = await service.list(OWNER, { page: 2, pageSize: 20 });
    expect(result.page).toBe(2);
  });
});
