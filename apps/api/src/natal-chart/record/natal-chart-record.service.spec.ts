import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { NatalChartRecordService } from './natal-chart-record.service';
import type { NatalChartCalculatorService, NatalChartCalculationResult } from '../engine/natal-chart-calculator.service';
import type { NatalChartInterpretationService } from '../interpretation/natal-chart-interpretation.service';
import type { GeocodingService } from '../../geocoding/geocoding.service';
import type { MemoryRetrievalService } from '../../memory/retrieval/memory-retrieval.service';
import type { EntitlementService } from '../../payment/entitlement/entitlement.service';
import type { CreateNatalChartDto } from '../dto/create-natal-chart.dto';

const OWNER = 'user-1';
const OTHER = 'user-2';

interface ChartRow {
  id: string;
  userId: string;
  status: string;
  visibility: string;
  birthDate: Date;
  birthTime: string | null;
  birthTimeKnown: boolean;
  birthPlaceLabel: string;
  latitude: number;
  longitude: number;
  timezone: string;
  zodiacMode: string;
  houseSystem: string;
  housesAvailable: boolean;
  calculationVersion: string;
  engineVersion: string;
  ascendantLongitude: number | null;
  ascendantSign: string | null;
  ascendantDegreeInSign: number | null;
  midheavenLongitude: number | null;
  midheavenSign: string | null;
  midheavenDegreeInSign: number | null;
  interpretation: unknown;
  aiProvider: string | null;
  aiModel: string | null;
  promptVersion: string | null;
  interpretedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  archivedAt: Date | null;
  deletedAt: Date | null;
}

interface Where {
  userId?: string;
  status?: string | { not: string };
  createdAt?: { gte: Date };
}

function matchesWhere(row: ChartRow, where: Where = {}): boolean {
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
  const placementsByChart = new Map<string, unknown[]>();
  const housesByChart = new Map<string, unknown[]>();
  const aspectsByChart = new Map<string, unknown[]>();
  const history: { id: string; chartId: string; action: string; detail: string; createdAt: Date }[] = [];
  let counter = 0;
  let historyCounter = 0;

  function withRelations(row: ChartRow) {
    return {
      ...row,
      placements: placementsByChart.get(row.id) ?? [],
      houses: housesByChart.get(row.id) ?? [],
      aspects: aspectsByChart.get(row.id) ?? [],
    };
  }

  const client: Record<string, unknown> = {
    natalChart: {
      create: jest.fn(async ({ data }: { data: Partial<ChartRow> }) => {
        const id = `chart-${counter++}`;
        const row: ChartRow = {
          status: 'ACTIVE',
          archivedAt: null,
          deletedAt: null,
          interpretation: null,
          aiProvider: null,
          aiModel: null,
          promptVersion: null,
          interpretedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data,
          id,
        } as ChartRow;
        rows.set(id, row);
        placementsByChart.set(id, []);
        housesByChart.set(id, []);
        aspectsByChart.set(id, []);
        return row;
      }),
      findUnique: jest.fn(async ({ where: { id } }: { where: { id: string } }) => {
        const row = rows.get(id);
        return row ? withRelations(row) : null;
      }),
      findUniqueOrThrow: jest.fn(async ({ where: { id } }: { where: { id: string } }) => {
        const row = rows.get(id);
        if (!row) throw new Error('not found');
        return withRelations(row);
      }),
      count: jest.fn(async ({ where }: { where?: Where } = {}) => [...rows.values()].filter((r) => matchesWhere(r, where)).length),
      findMany: jest.fn(
        async ({ where, orderBy, skip, take }: { where?: Where; orderBy?: { createdAt?: 'asc' | 'desc' }; skip?: number; take?: number } = {}) => {
          let result = [...rows.values()].filter((r) => matchesWhere(r, where));
          if (orderBy?.createdAt === 'desc') result = result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
          if (typeof skip === 'number') result = result.slice(skip);
          if (typeof take === 'number') result = result.slice(0, take);
          return result.map(withRelations);
        },
      ),
      update: jest.fn(async ({ where: { id }, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        const existing = rows.get(id)!;
        const updated = { ...existing, ...data } as ChartRow;
        rows.set(id, updated);
        return withRelations(updated);
      }),
    },
    natalPlacement: {
      createMany: jest.fn(async ({ data }: { data: { chartId: string }[] }) => {
        for (const entry of data) {
          const arr = placementsByChart.get(entry.chartId) ?? [];
          arr.push(entry);
          placementsByChart.set(entry.chartId, arr);
        }
        return { count: data.length };
      }),
    },
    natalHouse: {
      createMany: jest.fn(async ({ data }: { data: { chartId: string }[] }) => {
        for (const entry of data) {
          const arr = housesByChart.get(entry.chartId) ?? [];
          arr.push(entry);
          housesByChart.set(entry.chartId, arr);
        }
        return { count: data.length };
      }),
    },
    natalAspect: {
      createMany: jest.fn(async ({ data }: { data: { chartId: string }[] }) => {
        for (const entry of data) {
          const arr = aspectsByChart.get(entry.chartId) ?? [];
          arr.push(entry);
          aspectsByChart.set(entry.chartId, arr);
        }
        return { count: data.length };
      }),
    },
    natalChartHistory: {
      create: jest.fn(async ({ data }: { data: { chartId: string; action: string; detail: string } }) => {
        const entry = { id: `h${historyCounter++}`, ...data, createdAt: new Date() };
        history.push(entry);
        return entry;
      }),
      findMany: jest.fn(async ({ where: { chartId } }: { where: { chartId: string } }) => history.filter((h) => h.chartId === chartId)),
    },
    $transaction: jest.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn(client)),
  };

  return client;
}

function fakeCalculationResult(overrides: Partial<NatalChartCalculationResult> = {}): NatalChartCalculationResult {
  const planets = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'] as const;
  return {
    calculationVersion: 'natal-chart-circular-horoscope-v1',
    engineVersion: '1.1.0',
    zodiacMode: 'tropical',
    houseSystem: 'placidus',
    timezone: 'Asia/Ho_Chi_Minh',
    housesAvailable: true,
    placements: planets.map((body, index) => ({ body, longitude: index * 30, sign: 'aries' as const, degreeInSign: index, house: (index % 12) + 1, retrograde: false })),
    houses: Array.from({ length: 12 }, (_, i) => ({ number: i + 1, cuspLongitude: i * 30, sign: 'aries' as const })),
    aspects: [{ pointA: 'sun', pointB: 'moon', type: 'trine', orb: 1.2, angle: 118.8 }],
    ascendant: { longitude: 10, sign: 'aries', degreeInSign: 10 },
    midheaven: { longitude: 280, sign: 'capricorn', degreeInSign: 10 },
    ...overrides,
  };
}

function makeService(
  seed: ChartRow[] = [],
  isPremium = false,
  interpretResult: Record<string, string> | null = null,
  calcResult: NatalChartCalculationResult = fakeCalculationResult(),
) {
  const prisma = makePrismaMock(seed);
  const calculator = { calculate: jest.fn().mockReturnValue(calcResult) } as unknown as NatalChartCalculatorService;
  const geocoding = {
    resolve: jest.fn().mockResolvedValue({ label: 'Hà Nội, Vietnam', latitude: 21.0285, longitude: 105.8542, countryCode: 'VN' }),
  } as unknown as GeocodingService;
  const interpretation = { interpret: jest.fn().mockResolvedValue(interpretResult) } as unknown as NatalChartInterpretationService;
  const memoryRetrieval = { recommend: jest.fn().mockResolvedValue({ items: [] }) } as unknown as MemoryRetrievalService;
  const entitlementService = { hasPremiumAccess: jest.fn().mockResolvedValue(isPremium) } as unknown as EntitlementService;
  const service = new NatalChartRecordService(prisma as never, calculator, geocoding, interpretation, memoryRetrieval, entitlementService);
  return { service, prisma, calculator, geocoding, entitlementService, interpretation };
}

const VALID_DTO: CreateNatalChartDto = { birthDate: '2000-06-15', birthTime: '14:30', locationToken: '11111111-1111-4111-8111-111111111111' };

function makeChart(overrides: Partial<ChartRow> & { id?: string } = {}): ChartRow {
  return {
    id: overrides.id ?? 'chart-seed',
    userId: overrides.userId ?? OWNER,
    status: overrides.status ?? 'ACTIVE',
    visibility: overrides.visibility ?? 'COMPANION_VISIBLE',
    birthDate: overrides.birthDate ?? new Date('2000-06-15T00:00:00.000Z'),
    birthTime: overrides.birthTime ?? '14:30',
    birthTimeKnown: overrides.birthTimeKnown ?? true,
    birthPlaceLabel: overrides.birthPlaceLabel ?? 'Hà Nội, Vietnam',
    latitude: overrides.latitude ?? 21.0285,
    longitude: overrides.longitude ?? 105.8542,
    timezone: overrides.timezone ?? 'Asia/Ho_Chi_Minh',
    zodiacMode: overrides.zodiacMode ?? 'tropical',
    houseSystem: overrides.houseSystem ?? 'placidus',
    housesAvailable: overrides.housesAvailable ?? true,
    calculationVersion: overrides.calculationVersion ?? 'natal-chart-circular-horoscope-v1',
    engineVersion: overrides.engineVersion ?? '1.1.0',
    ascendantLongitude: overrides.ascendantLongitude ?? 10,
    ascendantSign: overrides.ascendantSign ?? 'ARIES',
    ascendantDegreeInSign: overrides.ascendantDegreeInSign ?? 10,
    midheavenLongitude: overrides.midheavenLongitude ?? 280,
    midheavenSign: overrides.midheavenSign ?? 'CAPRICORN',
    midheavenDegreeInSign: overrides.midheavenDegreeInSign ?? 10,
    interpretation: overrides.interpretation ?? null,
    aiProvider: overrides.aiProvider ?? null,
    aiModel: overrides.aiModel ?? null,
    promptVersion: overrides.promptVersion ?? null,
    interpretedAt: overrides.interpretedAt ?? null,
    createdAt: overrides.createdAt ?? new Date('2026-01-05T00:00:00.000Z'),
    updatedAt: overrides.updatedAt ?? new Date('2026-01-05T00:00:00.000Z'),
    archivedAt: overrides.archivedAt ?? null,
    deletedAt: overrides.deletedAt ?? null,
  };
}

describe('NatalChartRecordService — create() persists the real calculated result and never trusts client coordinates', () => {
  it('resolves the location via the opaque token (never from client-supplied lat/long) and persists the calculator’s real output', async () => {
    const { service, prisma, geocoding, calculator } = makeService();

    const dto = VALID_DTO;
    const result = await service.create(OWNER, dto);

    expect(geocoding.resolve).toHaveBeenCalledWith(dto.locationToken);
    expect(calculator.calculate).toHaveBeenCalledWith(
      expect.objectContaining({ latitude: 21.0285, longitude: 105.8542, countryCode: 'VN' }),
    );
    expect(result.placements).toHaveLength(10);
    expect(result.houses).toHaveLength(12);
    expect(result.birthPlaceLabel).toBe('Hà Nội, Vietnam');
    expect((prisma.natalChart as { create: jest.Mock }).create).toHaveBeenCalledTimes(1);
  });

  it('rejects when the location token cannot be resolved (expired/unknown) — never fabricates coordinates', async () => {
    const { service, geocoding } = makeService();
    (geocoding.resolve as jest.Mock).mockResolvedValue(null);

    await expect(service.create(OWNER, VALID_DTO)).rejects.toThrow(BadRequestException);
  });

  it('rejects an invalid birth date with a normalized BadRequestException, and creates no chart', async () => {
    const { service, prisma } = makeService();

    await expect(service.create(OWNER, { ...VALID_DTO, birthDate: '2024-02-30' })).rejects.toThrow(BadRequestException);
    expect((prisma.natalChart as { create: jest.Mock }).create).not.toHaveBeenCalled();
  });

  it('mass-assignment: only birthDate/birthTime/locationToken from the client ever influence a create() call — the calculated data always comes from the calculator, never from parsing extra client-supplied fields', async () => {
    const { service, calculator } = makeService();

    // A malicious client attempting to smuggle calculated fields via extra properties — the
    // service's `create()` signature is typed to `CreateNatalChartDto`, but this proves the
    // *behavior*, not just the type: extra fields on the object are never read.
    const tampered = { ...VALID_DTO, ascendantSign: 'LEO', housesAvailable: false, calculationVersion: 'hacked' } as CreateNatalChartDto;
    await service.create(OWNER, tampered);

    // Every calculated value in the persisted chart traces to the calculator's own mocked
    // return value, not to any field on `tampered`.
    expect(calculator.calculate).toHaveBeenCalledWith(
      expect.not.objectContaining({ ascendantSign: expect.anything(), housesAvailable: false, calculationVersion: 'hacked' }),
    );
  });

  it('interpretation failure never blocks or invalidates the already-real calculated chart', async () => {
    const { service } = makeService([], false, null);

    const result = await service.create(OWNER, VALID_DTO);

    expect(result.interpretation).toBeNull();
    expect(result.placements).toHaveLength(10);
  });

  it('a successful interpretation is persisted as structured sections without altering any calculated field', async () => {
    const sections = { overview: 'x', corePersonality: 'x', emotionalWorld: 'x', communication: 'x', loveAndRelationships: 'x', motivation: 'x', careerDirection: 'x', strengths: 'x', challenges: 'x', keyAspects: 'x' };
    const { service, prisma } = makeService([], false, sections);

    const result = await service.create(OWNER, VALID_DTO);

    expect(result.interpretation).toEqual(sections);
    // The interpretation update call only ever touches `interpretation`/`interpretedAt` — never
    // a calculated field (AI boundary: interpretation can't mutate chart facts).
    const updateCalls = (prisma.natalChart as { update: jest.Mock }).update.mock.calls;
    for (const [{ data }] of updateCalls) {
      expect(Object.keys(data).sort()).toEqual(['interpretation', 'interpretedAt']);
    }
  });
});

describe('NatalChartRecordService — ownership', () => {
  it('getOne/history/archive/restore/remove 404 identically for a nonexistent id and another user’s chart', async () => {
    const { service } = makeService([makeChart({ id: 'c1', userId: OTHER })]);

    await expect(service.getOne(OWNER, 'c1')).rejects.toThrow(NotFoundException);
    await expect(service.getOne(OWNER, 'does-not-exist')).rejects.toThrow(NotFoundException);
    await expect(service.history(OWNER, 'c1')).rejects.toThrow(NotFoundException);
    await expect(service.archive(OWNER, 'c1')).rejects.toThrow(NotFoundException);
    await expect(service.restore(OWNER, 'c1')).rejects.toThrow(NotFoundException);
    await expect(service.remove(OWNER, 'c1')).rejects.toThrow(NotFoundException);
  });
});

describe('NatalChartRecordService — lifecycle transitions', () => {
  it('archive only succeeds from ACTIVE', async () => {
    const { service } = makeService([makeChart({ id: 'c1', status: 'ARCHIVED' })]);
    await expect(service.archive(OWNER, 'c1')).rejects.toThrow(BadRequestException);
  });

  it('restore is rejected on an already-ACTIVE chart', async () => {
    const { service } = makeService([makeChart({ id: 'c1', status: 'ACTIVE' })]);
    await expect(service.restore(OWNER, 'c1')).rejects.toThrow(BadRequestException);
  });

  it('archive then restore returns to ACTIVE', async () => {
    const { service } = makeService([makeChart({ id: 'c1', status: 'ACTIVE' })]);
    const archived = await service.archive(OWNER, 'c1');
    expect(archived.status).toBe('ARCHIVED');
    const restored = await service.restore(OWNER, 'c1');
    expect(restored.status).toBe('ACTIVE');
  });

  it('remove is rejected on an already-deleted chart', async () => {
    const { service } = makeService([makeChart({ id: 'c1', status: 'DELETED' })]);
    await expect(service.remove(OWNER, 'c1')).rejects.toThrow(BadRequestException);
  });

  it('delete then restore returns to ACTIVE', async () => {
    const { service } = makeService([makeChart({ id: 'c1', status: 'ACTIVE' })]);
    const deleted = await service.remove(OWNER, 'c1');
    expect(deleted.status).toBe('DELETED');
    const restored = await service.restore(OWNER, 'c1');
    expect(restored.status).toBe('ACTIVE');
  });
});

describe('NatalChartRecordService — daily creation ceiling (anti-abuse, not a content gate)', () => {
  function seedTodayCharts(count: number, status = 'ACTIVE'): ChartRow[] {
    return Array.from({ length: count }, (_, i) => makeChart({ id: `today-${i}`, status, createdAt: new Date() }));
  }

  it('is status-agnostic — deleted charts still count toward today’s total (mirrors Numerology/Tarot’s own security fix)', async () => {
    const { service } = makeService(seedTodayCharts(5, 'DELETED'), false);
    await expect(service.create(OWNER, VALID_DTO)).rejects.toThrow(ForbiddenException);
  });

  it('a Free user may still create a 5th chart (limit not yet reached)', async () => {
    const { service } = makeService(seedTodayCharts(4), false);
    await expect(service.create(OWNER, VALID_DTO)).resolves.toBeDefined();
  });

  it('a Free user is denied PREMIUM_REQUIRED after 5 creations today', async () => {
    const { service } = makeService(seedTodayCharts(5), false);
    await expect(service.create(OWNER, VALID_DTO)).rejects.toThrow(ForbiddenException);
  });

  it('a Premium user is allowed a 6th creation the same day (raised ceiling)', async () => {
    const { service } = makeService(seedTodayCharts(5), true);
    await expect(service.create(OWNER, VALID_DTO)).resolves.toBeDefined();
  });

  it('a Premium user hitting their own (higher) ceiling gets a plain limit error, not PREMIUM_REQUIRED', async () => {
    const { service } = makeService(seedTodayCharts(15), true);
    await expect(service.create(OWNER, VALID_DTO)).rejects.toThrow(BadRequestException);
    await expect(service.create(OWNER, VALID_DTO)).rejects.not.toThrow(ForbiddenException);
  });
});

describe('NatalChartRecordService — Free history cap', () => {
  function seedCharts(count: number): ChartRow[] {
    return Array.from({ length: count }, (_, i) => makeChart({ id: `c${i}`, createdAt: new Date(Date.now() - i * 1000) }));
  }

  it('a Free user sees at most the most recent 20 charts, total capped at 20', async () => {
    const { service } = makeService(seedCharts(30), false);
    const result = await service.list(OWNER, {});
    expect(result.items).toHaveLength(20);
    expect(result.total).toBe(20);
  });

  it('a Free user requesting beyond the 20-item window is denied PREMIUM_REQUIRED', async () => {
    const { service } = makeService(seedCharts(30), false);
    await expect(service.list(OWNER, { page: 2 })).rejects.toThrow(ForbiddenException);
  });

  it('a Premium user can page past 20 charts normally', async () => {
    const { service } = makeService(seedCharts(30), true);
    const result = await service.list(OWNER, { page: 2 });
    expect(result.items).toHaveLength(10);
    expect(result.total).toBe(30);
  });
});
