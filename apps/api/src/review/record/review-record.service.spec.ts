import { NotFoundException } from '@nestjs/common';
import { ReviewRecordService } from './review-record.service';
import type { ReviewGenerationService } from '../generation/review-generation.service';

const OWNER = 'user-1';
const OTHER = 'user-2';

interface EvidenceSeed {
  sourceType?: string;
  sourceId: string;
  category?: string;
  priority?: number;
}

interface ReviewOverrides {
  id?: string;
  userId?: string;
  window?: string;
  state?: string;
  windowStart?: Date;
  evidence?: EvidenceSeed[];
}

function makeReview(overrides: ReviewOverrides = {}) {
  const evidenceSeed = overrides.evidence ?? [{ sourceId: 'i1', category: 'GOAL', priority: 80 }];
  return {
    id: overrides.id ?? 'review-1',
    userId: overrides.userId ?? OWNER,
    window: overrides.window ?? 'WEEK',
    windowStart: overrides.windowStart ?? new Date('2026-01-05T00:00:00.000Z'),
    windowEnd: new Date('2026-01-11T23:59:59.999Z'),
    state: overrides.state ?? 'READY',
    overview: 'x',
    statistics: { journalCount: 1, memoryCreatedCount: 0, reflectionCount: 1, insightCount: 1, activityCount: 0, journalingStreakDays: 0, companionConversationCount: 0 },
    dedupeKey: `WEEK:${(overrides.windowStart ?? new Date('2026-01-05T00:00:00.000Z')).toISOString()}`,
    createdAt: new Date('2026-01-05T00:00:00.000Z'),
    updatedAt: new Date('2026-01-05T00:00:00.000Z'),
    resolvedAt: null,
    sections: [
      {
        id: 'section-1',
        reviewId: overrides.id ?? 'review-1',
        type: 'ACHIEVEMENTS',
        title: 'Achievements',
        summary: 'x',
        order: 0,
        createdAt: new Date('2026-01-05T00:00:00.000Z'),
        evidence: evidenceSeed.map((e) => ({
          id: `ev-${e.sourceId}`,
          reviewSectionId: 'section-1',
          sourceType: e.sourceType ?? 'INSIGHT',
          sourceId: e.sourceId,
          category: e.category ?? 'GOAL',
          priority: e.priority ?? 80,
          sourceTimestamp: new Date('2026-01-05T00:00:00.000Z'),
          contribution: 'x',
          createdAt: new Date('2026-01-05T00:00:00.000Z'),
        })),
      },
    ],
  };
}

type Row = ReturnType<typeof makeReview>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function matchesWhere(row: Row, where: Record<string, any>): boolean {
  if (where.userId && row.userId !== where.userId) return false;
  if (where.window && row.window !== where.window) return false;
  if (where.state) {
    if (typeof where.state === 'object' && where.state.not) {
      if (row.state === where.state.not) return false;
    } else if (row.state !== where.state) return false;
  }
  if (where.windowStart) {
    const t = row.windowStart.getTime();
    if (where.windowStart.gte && t < where.windowStart.gte.getTime()) return false;
    if (where.windowStart.lte && t > where.windowStart.lte.getTime()) return false;
  }
  return true;
}

function makePrismaMock(seed: Row[] = []) {
  const rows = new Map(seed.map((r) => [r.id, r]));
  return {
    review: {
      findUnique: jest.fn(async ({ where: { id } }: { where: { id: string } }) => rows.get(id) ?? null),
      findMany: jest.fn(async ({ where, skip, take }: { where: Record<string, unknown>; skip?: number; take?: number }) => {
        let matched = [...rows.values()].filter((row) => matchesWhere(row, where));
        if (skip !== undefined) matched = matched.slice(skip);
        if (take !== undefined) matched = matched.slice(0, take);
        return matched;
      }),
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

function makeService(seed: Row[] = []) {
  const prisma = makePrismaMock(seed);
  const generation = { ensureGenerated: jest.fn().mockResolvedValue('review-1') } as unknown as ReviewGenerationService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const service = new ReviewRecordService(prisma as any, generation);
  return { service, prisma };
}

describe('ReviewRecordService — ownership', () => {
  it('getOne 404s identically for a nonexistent id and another user’s review', async () => {
    const { service } = makeService([makeReview({ id: 'r1', userId: OTHER })]);
    await expect(service.getOne(OWNER, 'r1')).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.getOne(OWNER, 'does-not-exist')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('archive is ownership-scoped', async () => {
    const { service } = makeService([makeReview({ id: 'r1', userId: OTHER })]);
    await expect(service.archive(OWNER, 'r1')).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('ReviewRecordService — archive lifecycle', () => {
  it('archive is idempotent and sets resolvedAt', async () => {
    const { service } = makeService([makeReview({ id: 'r1' })]);
    const first = await service.archive(OWNER, 'r1');
    expect(first.state).toBe('ARCHIVED');

    const second = await service.archive(OWNER, 'r1');
    expect(second.state).toBe('ARCHIVED');
  });

  it('an archived review keeps its sections/evidence fully intact', async () => {
    const { service } = makeService([makeReview({ id: 'r1' })]);
    await service.archive(OWNER, 'r1');
    const fetched = await service.getOne(OWNER, 'r1');
    expect(fetched.sections).toHaveLength(1);
    expect(fetched.sections[0]!.evidence).toHaveLength(1);
  });
});

describe('ReviewRecordService — list filters', () => {
  it('filters by window and state, excluding ARCHIVED by default', async () => {
    const { service } = makeService([
      makeReview({ id: 'week-ready', window: 'WEEK', state: 'READY' }),
      makeReview({ id: 'month-ready', window: 'MONTH', state: 'READY' }),
      makeReview({ id: 'week-archived', window: 'WEEK', state: 'ARCHIVED' }),
    ]);
    expect((await service.list(OWNER, { window: 'WEEK' as never })).items.map((r) => r.id).sort()).toEqual(['week-ready']);
    expect((await service.list(OWNER, {})).items.map((r) => r.id).sort()).toEqual(['month-ready', 'week-ready']);
    expect((await service.list(OWNER, { state: 'ARCHIVED' as never })).items.map((r) => r.id)).toEqual(['week-archived']);
  });

  it('filters by date range on windowStart', async () => {
    const { service } = makeService([
      makeReview({ id: 'old', windowStart: new Date('2026-01-01T00:00:00.000Z') }),
      makeReview({ id: 'new', windowStart: new Date('2026-02-01T00:00:00.000Z') }),
    ]);
    const result = await service.list(OWNER, { from: '2026-01-15T00:00:00.000Z' });
    expect(result.items.map((r) => r.id)).toEqual(['new']);
  });

  it('never returns another user’s reviews', async () => {
    const { service } = makeService([makeReview({ id: 'mine', userId: OWNER }), makeReview({ id: 'theirs', userId: OTHER })]);
    expect((await service.list(OWNER, {})).items.map((r) => r.id)).toEqual(['mine']);
  });
});

describe('ReviewRecordService — detail filters (Phase 6)', () => {
  it('category filter narrows evidence and drops sections left with none', async () => {
    const { service } = makeService([
      makeReview({
        id: 'r1',
        evidence: [
          { sourceId: 'a', category: 'GOAL', priority: 80 },
          { sourceId: 'b', category: 'GOAL', priority: 20 },
        ],
      }),
    ]);
    const filtered = await service.getOne(OWNER, 'r1', { priorityTier: 'HIGH' });
    expect(filtered.sections).toHaveLength(1);
    expect(filtered.sections[0]!.evidence.map((e) => e.sourceId)).toEqual(['a']);
  });

  it('a filter matching nothing drops the section entirely, never an empty placeholder', async () => {
    const { service } = makeService([makeReview({ id: 'r1', evidence: [{ sourceId: 'a', category: 'GOAL', priority: 80 }] })]);
    const filtered = await service.getOne(OWNER, 'r1', { category: 'WELLBEING' });
    expect(filtered.sections).toEqual([]);
  });

  it('no filters returns every section/evidence unmodified', async () => {
    const { service } = makeService([makeReview({ id: 'r1' })]);
    const unfiltered = await service.getOne(OWNER, 'r1', {});
    expect(unfiltered.sections).toHaveLength(1);
  });
});
