import { NotFoundException } from '@nestjs/common';
import { InsightRecordService } from './insight-record.service';
import type { InsightGenerationService } from '../generation/insight-generation.service';

const OWNER = 'user-1';
const OTHER = 'user-2';

interface CandidateOverrides {
  id?: string;
  userId?: string;
  category?: string;
  status?: string;
  priority?: number;
}

function makeCandidate(overrides: CandidateOverrides = {}) {
  return {
    id: overrides.id ?? 'insight-1',
    userId: overrides.userId ?? OWNER,
    category: overrides.category ?? 'GOAL',
    status: overrides.status ?? 'READY',
    window: 'WEEK',
    windowStart: new Date('2026-01-01T00:00:00.000Z'),
    windowEnd: new Date('2026-01-05T00:00:00.000Z'),
    ruleExplanation: '2 reflections connected by SUPPORTS relationships.',
    priority: overrides.priority ?? 60,
    priorityFactors: { frequency: 6 },
    dedupeKey: `${overrides.category ?? 'GOAL'}:anchor`,
    createdAt: new Date('2026-01-05T00:00:00.000Z'),
    updatedAt: new Date('2026-01-05T00:00:00.000Z'),
    resolvedAt: null,
    evidence: [],
    relationships: [],
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makePrismaMock(seed: ReturnType<typeof makeCandidate>[] = []) {
  const rows = new Map(seed.map((c) => [c.id, { ...c }]));
  return {
    _rows: rows,
    insightCandidate: {
      findUnique: jest.fn(async ({ where: { id } }: { where: { id: string } }) => rows.get(id) ?? null),
      findMany: jest.fn(async ({ where }: { where: Record<string, unknown> }) => [...rows.values()].filter((row) => matchesWhere(row, where))),
      count: jest.fn(async ({ where }: { where: Record<string, unknown> }) => [...rows.values()].filter((row) => matchesWhere(row, where)).length),
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
  if (where.status && typeof where.status === 'object' && where.status !== null) {
    const statusFilter = where.status as { not?: string };
    if (statusFilter.not && row.status === statusFilter.not) return false;
  } else if (where.status && row.status !== where.status) {
    return false;
  }
  return true;
}

function makeService(seed: ReturnType<typeof makeCandidate>[] = []) {
  const prisma = makePrismaMock(seed);
  const generation = { ensureGenerated: jest.fn().mockResolvedValue(undefined) } as unknown as InsightGenerationService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const service = new InsightRecordService(prisma as any, generation);
  return { service, prisma, generation };
}

describe('InsightRecordService — ownership', () => {
  it('getOne 404s identically for a nonexistent id and for another user’s candidate', async () => {
    const { service } = makeService([makeCandidate({ id: 'i1', userId: OTHER })]);
    await expect(service.getOne(OWNER, 'i1')).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.getOne(OWNER, 'does-not-exist')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('archive is ownership-scoped', async () => {
    const { service } = makeService([makeCandidate({ id: 'i1', userId: OTHER })]);
    await expect(service.archive(OWNER, 'i1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('always regenerates before reading', async () => {
    const { service, generation } = makeService([]);
    await service.list(OWNER, {});
    expect(generation.ensureGenerated).toHaveBeenCalledWith(OWNER);
  });
});

describe('InsightRecordService — archive lifecycle', () => {
  it('archive is idempotent and sets resolvedAt', async () => {
    const { service } = makeService([makeCandidate({ id: 'i1' })]);
    const first = await service.archive(OWNER, 'i1');
    expect(first.status).toBe('ARCHIVED');
    expect(first.resolvedAt).not.toBeNull();

    const second = await service.archive(OWNER, 'i1');
    expect(second.status).toBe('ARCHIVED');
  });
});

describe('InsightRecordService — list', () => {
  it('filters by category and status', async () => {
    const { service } = makeService([
      makeCandidate({ id: 'i1', category: 'GOAL', status: 'READY' }),
      makeCandidate({ id: 'i2', category: 'TOPIC', status: 'READY' }),
      makeCandidate({ id: 'i3', category: 'GOAL', status: 'NOT_READY' }),
    ]);
    const result = await service.list(OWNER, { category: 'GOAL' });
    expect(result.items.map((i) => i.id).sort()).toEqual(['i1', 'i3']);

    const readyOnly = await service.list(OWNER, { status: 'READY' });
    expect(readyOnly.items.map((i) => i.id).sort()).toEqual(['i1', 'i2']);
  });

  it('excludes ARCHIVED candidates by default, but includes them with an explicit status filter', async () => {
    const { service } = makeService([
      makeCandidate({ id: 'i1', status: 'READY' }),
      makeCandidate({ id: 'i2', status: 'ARCHIVED' }),
    ]);
    const defaultView = await service.list(OWNER, {});
    expect(defaultView.items.map((i) => i.id)).toEqual(['i1']);

    const archivedView = await service.list(OWNER, { status: 'ARCHIVED' });
    expect(archivedView.items.map((i) => i.id)).toEqual(['i2']);
  });

  it('never returns another user’s candidates', async () => {
    const { service } = makeService([makeCandidate({ id: 'i1', userId: OWNER }), makeCandidate({ id: 'i2', userId: OTHER })]);
    const result = await service.list(OWNER, {});
    expect(result.items.map((i) => i.id)).toEqual(['i1']);
  });
});

describe('InsightRecordService — statistics', () => {
  it('counts by status/category and computes average priority', async () => {
    const { service } = makeService([
      makeCandidate({ id: 'i1', status: 'READY', priority: 60 }),
      makeCandidate({ id: 'i2', status: 'READY', priority: 40 }),
      makeCandidate({ id: 'i3', status: 'NOT_READY', priority: 10 }),
    ]);
    const stats = await service.statistics(OWNER);
    expect(stats.total).toBe(3);
    expect(stats.byStatus.READY).toBe(2);
    expect(stats.readyCount).toBe(2);
    expect(stats.averagePriority).toBe(Math.round((60 + 40 + 10) / 3));
  });
});
