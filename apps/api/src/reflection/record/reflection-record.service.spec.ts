import { NotFoundException } from '@nestjs/common';
import { ReflectionRecordService } from './reflection-record.service';
import type { ReflectionGenerationService } from '../generation/reflection-generation.service';
import type { ReflectionValidityService } from '../validity/reflection-validity.service';

const OWNER = 'user-1';
const OTHER = 'user-2';

interface CandidateOverrides {
  id?: string;
  userId?: string;
  category?: string;
  trigger?: string;
  state?: string;
  score?: number;
  createdAt?: Date;
  groupKey?: string;
  pinned?: boolean;
}

function makeCandidate(overrides: CandidateOverrides = {}) {
  return {
    id: overrides.id ?? 'reflection-1',
    userId: overrides.userId ?? OWNER,
    category: overrides.category ?? 'TOPIC',
    trigger: overrides.trigger ?? 'REPEATED_TOPIC',
    state: overrides.state ?? 'READY',
    window: 'WEEK',
    windowStart: new Date('2026-01-01T00:00:00.000Z'),
    windowEnd: new Date('2026-01-05T00:00:00.000Z'),
    reason: 'You mentioned this a few times.',
    score: overrides.score ?? 50,
    scoreFactors: { frequency: 12 },
    groupKey: overrides.groupKey ?? 'TOPIC:example',
    visibility: 'COMPANION_VISIBLE',
    pinned: overrides.pinned ?? false,
    dedupeKey: `${overrides.trigger ?? 'REPEATED_TOPIC'}:${overrides.groupKey ?? 'TOPIC:example'}:2026-01-01T00:00:00.000Z`,
    createdAt: overrides.createdAt ?? new Date('2026-01-05T00:00:00.000Z'),
    updatedAt: overrides.createdAt ?? new Date('2026-01-05T00:00:00.000Z'),
    resolvedAt: null,
    expiredAt: null,
    sources: [{ sourceType: 'JOURNAL', sourceId: 'j1', sourceTimestamp: new Date('2026-01-01T00:00:00.000Z') }],
  };
}

function makePrismaMock(seed: ReturnType<typeof makeCandidate>[] = []) {
  const rows = new Map(seed.map((c) => [c.id, { ...c }]));

  return {
    _rows: rows,
    reflectionCandidate: {
      findUnique: jest.fn(async ({ where: { id } }: { where: { id: string } }) => rows.get(id) ?? null),
      findMany: jest.fn(async ({ where }: { where: Record<string, unknown> }) => {
        return [...rows.values()].filter((row) => matchesWhere(row, where));
      }),
      count: jest.fn(async ({ where }: { where: Record<string, unknown> }) => {
        return [...rows.values()].filter((row) => matchesWhere(row, where)).length;
      }),
      update: jest.fn(async ({ where: { id }, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        const existing = rows.get(id)!;
        const updated = { ...existing, ...data };
        rows.set(id, updated);
        return updated;
      }),
    },
  };
}

function matchesWhere(row: ReturnType<typeof makeCandidate>, where: Record<string, unknown>): boolean {
  if (where.userId && row.userId !== where.userId) return false;
  if (where.category && row.category !== where.category) return false;
  if (where.state && typeof where.state === 'object' && where.state !== null) {
    const stateFilter = where.state as { notIn?: string[]; in?: string[] };
    if (stateFilter.notIn && stateFilter.notIn.includes(row.state)) return false;
    if (stateFilter.in && !stateFilter.in.includes(row.state)) return false;
  } else if (where.state && row.state !== where.state) {
    return false;
  }
  return true;
}

function makeService(seed: ReturnType<typeof makeCandidate>[] = []) {
  const prisma = makePrismaMock(seed);
  const generation = { ensureGenerated: jest.fn().mockResolvedValue(undefined) } as unknown as ReflectionGenerationService;
  const validity = { revalidateForUser: jest.fn().mockResolvedValue(undefined) } as unknown as ReflectionValidityService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const service = new ReflectionRecordService(prisma as any, generation, validity);
  return { service, prisma, generation, validity };
}

describe('ReflectionRecordService — ownership', () => {
  it('getOne 404s identically for a nonexistent id and for another user’s candidate', async () => {
    const { service } = makeService([makeCandidate({ id: 'r1', userId: OTHER })]);
    await expect(service.getOne(OWNER, 'r1')).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.getOne(OWNER, 'does-not-exist')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('archive/dismiss are ownership-scoped', async () => {
    const { service } = makeService([makeCandidate({ id: 'r1', userId: OTHER })]);
    await expect(service.archive(OWNER, 'r1')).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.dismiss(OWNER, 'r1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('always regenerates and revalidates before reading', async () => {
    const { service, generation, validity } = makeService([]);
    await service.list(OWNER, {});
    expect(generation.ensureGenerated).toHaveBeenCalledWith(OWNER);
    expect(validity.revalidateForUser).toHaveBeenCalledWith(OWNER);
  });
});

describe('ReflectionRecordService — archive/dismiss lifecycle', () => {
  it('archive is idempotent and sets resolvedAt', async () => {
    const { service } = makeService([makeCandidate({ id: 'r1' })]);
    const first = await service.archive(OWNER, 'r1');
    expect(first.state).toBe('ARCHIVED');
    expect(first.resolvedAt).not.toBeNull();

    const second = await service.archive(OWNER, 'r1');
    expect(second.state).toBe('ARCHIVED');
  });

  it('dismiss is idempotent and sets resolvedAt', async () => {
    const { service } = makeService([makeCandidate({ id: 'r1' })]);
    const first = await service.dismiss(OWNER, 'r1');
    expect(first.state).toBe('DISMISSED');
    expect(first.resolvedAt).not.toBeNull();

    const second = await service.dismiss(OWNER, 'r1');
    expect(second.state).toBe('DISMISSED');
  });
});

describe('ReflectionRecordService — feed', () => {
  it('only returns READY candidates', async () => {
    const { service } = makeService([
      makeCandidate({ id: 'r1', state: 'READY' }),
      makeCandidate({ id: 'r2', state: 'DISMISSED' }),
      makeCandidate({ id: 'r3', state: 'ARCHIVED' }),
    ]);
    const feed = await service.feed(OWNER);
    expect(feed.map((c) => c.id)).toEqual(['r1']);
  });
});

describe('ReflectionRecordService — list', () => {
  it('excludes EXPIRED by default and filters by category', async () => {
    const { service } = makeService([
      makeCandidate({ id: 'r1', category: 'TOPIC', state: 'READY' }),
      makeCandidate({ id: 'r2', category: 'GOAL', state: 'READY' }),
      makeCandidate({ id: 'r3', category: 'TOPIC', state: 'EXPIRED' }),
    ]);
    const result = await service.list(OWNER, { category: 'TOPIC' });
    expect(result.items.map((i) => i.id)).toEqual(['r1']);
  });
});

describe('ReflectionRecordService — groups', () => {
  it('aggregates active candidates by groupKey', async () => {
    const { service } = makeService([
      makeCandidate({ id: 'r1', groupKey: 'TOPIC:pottery', score: 40, state: 'READY' }),
      makeCandidate({ id: 'r2', groupKey: 'TOPIC:pottery', score: 60, state: 'READY' }),
      makeCandidate({ id: 'r3', groupKey: 'GOAL:marathon', score: 30, state: 'READY' }),
    ]);
    const groups = await service.groups(OWNER);
    const pottery = groups.find((g) => g.groupKey === 'TOPIC:pottery')!;
    expect(pottery.count).toBe(2);
    expect(pottery.averageScore).toBe(50);
    expect(pottery.topScore).toBe(60);
  });
});

describe('ReflectionRecordService — timeline', () => {
  it('assigns a valid bucket to every item and respects a category filter', async () => {
    const { service } = makeService([
      makeCandidate({ id: 'r1', category: 'TOPIC', state: 'READY' }),
      makeCandidate({ id: 'r2', category: 'GOAL', state: 'READY' }),
    ]);
    const result = await service.timeline(OWNER, { category: 'TOPIC' });
    expect(result.items).toHaveLength(1);
    expect(['today', 'this_week', 'last_week', 'last_month', 'earlier']).toContain(result.items[0]!.bucket);
  });
});

describe('ReflectionRecordService — statistics', () => {
  it('counts by state and computes dismissal/archive rates', async () => {
    const { service } = makeService([
      makeCandidate({ id: 'r1', state: 'READY' }),
      makeCandidate({ id: 'r2', state: 'DISMISSED' }),
      makeCandidate({ id: 'r3', state: 'ARCHIVED' }),
      makeCandidate({ id: 'r4', state: 'DISMISSED' }),
    ]);
    const stats = await service.statistics(OWNER);
    expect(stats.total).toBe(4);
    expect(stats.byState.DISMISSED).toBe(2);
    expect(stats.byState.ARCHIVED).toBe(1);
    expect(stats.dismissalRate).toBe(0.5);
    expect(stats.archiveRate).toBe(0.25);
  });
});
