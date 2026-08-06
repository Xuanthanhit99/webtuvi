import { NotFoundException } from '@nestjs/common';
import { InsightPresentationService } from './insight-presentation.service';
import type { InsightGenerationService } from '../generation/insight-generation.service';

const OWNER = 'user-1';
const OTHER = 'user-2';

interface EvidenceSeed {
  reflectionCandidateId: string;
  contribution: string;
  reflectionCategory?: string;
  reflectionScore?: number;
  reflectionState?: string;
  groupKey?: string;
  sources?: { sourceType: string; sourceId: string; sourceTimestamp?: Date }[];
}

interface CandidateOverrides {
  id?: string;
  userId?: string;
  category?: string;
  status?: string;
  priority?: number;
  pinned?: boolean;
  createdAt?: Date;
  evidence?: EvidenceSeed[];
  relationshipCount?: number;
}

function makeCandidate(overrides: CandidateOverrides = {}) {
  const evidenceSeed = overrides.evidence ?? [{ reflectionCandidateId: 'r1', contribution: 'x (score 50).' }];
  return {
    id: overrides.id ?? 'insight-1',
    userId: overrides.userId ?? OWNER,
    category: overrides.category ?? 'GOAL',
    status: overrides.status ?? 'READY',
    window: 'WEEK',
    windowStart: new Date('2026-01-01T00:00:00.000Z'),
    windowEnd: new Date('2026-01-05T00:00:00.000Z'),
    ruleExplanation: 'x',
    priority: overrides.priority ?? 60,
    priorityFactors: { frequency: 6 },
    pinned: overrides.pinned ?? false,
    dedupeKey: `${overrides.category ?? 'GOAL'}:anchor`,
    createdAt: overrides.createdAt ?? new Date('2026-01-05T00:00:00.000Z'),
    updatedAt: overrides.createdAt ?? new Date('2026-01-05T00:00:00.000Z'),
    resolvedAt: null,
    evidence: evidenceSeed.map((e) => ({
      reflectionCandidateId: e.reflectionCandidateId,
      contribution: e.contribution,
      reflectionCandidate: {
        category: e.reflectionCategory ?? 'TOPIC',
        score: e.reflectionScore ?? 50,
        state: e.reflectionState ?? 'READY',
        groupKey: e.groupKey ?? 'TOPIC:example',
        sources: (e.sources ?? []).map((s) => ({ sourceType: s.sourceType, sourceId: s.sourceId, sourceTimestamp: s.sourceTimestamp ?? new Date('2026-01-01T00:00:00.000Z') })),
      },
    })),
    _count: { evidence: evidenceSeed.length, relationships: overrides.relationshipCount ?? 0 },
  };
}

type Row = ReturnType<typeof makeCandidate>;

function priorityMatches(priority: number, filter?: { gte?: number; lt?: number }): boolean {
  if (!filter) return true;
  if (filter.gte !== undefined && priority < filter.gte) return false;
  if (filter.lt !== undefined && priority >= filter.lt) return false;
  return true;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function matchesWhere(row: Row, where: Record<string, any>): boolean {
  if (where.userId && row.userId !== where.userId) return false;
  if (where.category && row.category !== where.category) return false;
  if (where.pinned !== undefined && row.pinned !== where.pinned) return false;
  if (where.priority && !priorityMatches(row.priority, where.priority)) return false;
  if (where.status) {
    if (typeof where.status === 'object' && where.status.not) {
      if (row.status === where.status.not) return false;
    } else if (row.status !== where.status) return false;
  }
  if (where.createdAt) {
    const t = row.createdAt.getTime();
    if (where.createdAt.gte && t < where.createdAt.gte.getTime()) return false;
    if (where.createdAt.lte && t > where.createdAt.lte.getTime()) return false;
  }
  if (where.evidence?.some?.reflectionCandidate?.sources?.some?.sourceType) {
    const wanted = where.evidence.some.reflectionCandidate.sources.some.sourceType;
    const hasSource = row.evidence.some((e) => e.reflectionCandidate.sources.some((s) => s.sourceType === wanted));
    if (!hasSource) return false;
  }
  return true;
}

function makePrismaMock(seed: Row[] = [], journalIds: string[] = [], memoryIds: string[] = []) {
  const rows = new Map(seed.map((c) => [c.id, c]));
  return {
    insightCandidate: {
      findUnique: jest.fn(async ({ where: { id } }: { where: { id: string } }) => rows.get(id) ?? null),
      findMany: jest.fn(async ({ where, orderBy, skip, take }: { where: Record<string, unknown>; orderBy?: { priority?: string; createdAt?: string }[]; skip?: number; take?: number }) => {
        let matched = [...rows.values()].filter((row) => matchesWhere(row, where));
        if (orderBy?.[0]?.priority) matched = matched.sort((a, b) => b.priority - a.priority);
        else if (orderBy?.[0]?.createdAt) matched = matched.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
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
    journalEntry: {
      findMany: jest.fn(async ({ where }: { where: { id: { in: string[] } } }) =>
        where.id.in.filter((id) => journalIds.includes(id)).map((id) => ({ id })),
      ),
    },
    memory: {
      findMany: jest.fn(async ({ where }: { where: { id: { in: string[] } } }) =>
        where.id.in.filter((id) => memoryIds.includes(id)).map((id) => ({ id })),
      ),
    },
  };
}

function makeService(seed: Row[] = [], journalIds: string[] = [], memoryIds: string[] = []) {
  const prisma = makePrismaMock(seed, journalIds, memoryIds);
  const generation = { ensureGenerated: jest.fn().mockResolvedValue(undefined) } as unknown as InsightGenerationService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const service = new InsightPresentationService(prisma as any, generation);
  return { service, prisma, generation };
}

describe('InsightPresentationService — cards() filters', () => {
  it('filters by category', async () => {
    const { service } = makeService([makeCandidate({ id: 'i1', category: 'GOAL' }), makeCandidate({ id: 'i2', category: 'TOPIC' })]);
    const result = await service.cards(OWNER, { category: 'GOAL' });
    expect(result.items.map((i) => i.id)).toEqual(['i1']);
  });

  it('filters by priority tier', async () => {
    const { service } = makeService([
      makeCandidate({ id: 'low', priority: 10 }),
      makeCandidate({ id: 'medium', priority: 55 }),
      makeCandidate({ id: 'high', priority: 90 }),
    ]);
    expect((await service.cards(OWNER, { priorityTier: 'HIGH' })).items.map((i) => i.id)).toEqual(['high']);
    expect((await service.cards(OWNER, { priorityTier: 'LOW' })).items.map((i) => i.id)).toEqual(['low']);
  });

  it('filters by source — only insights with >= 1 evidence reflection citing that source type', async () => {
    const { service } = makeService([
      makeCandidate({ id: 'journal-backed', evidence: [{ reflectionCandidateId: 'r1', contribution: 'x', sources: [{ sourceType: 'JOURNAL', sourceId: 'j1' }] }] }),
      makeCandidate({ id: 'memory-backed', evidence: [{ reflectionCandidateId: 'r2', contribution: 'x', sources: [{ sourceType: 'MEMORY', sourceId: 'm1' }] }] }),
    ]);
    expect((await service.cards(OWNER, { source: 'JOURNAL' })).items.map((i) => i.id)).toEqual(['journal-backed']);
  });

  it('filters by pinned', async () => {
    const { service } = makeService([makeCandidate({ id: 'pinned-one', pinned: true }), makeCandidate({ id: 'unpinned', pinned: false })]);
    expect((await service.cards(OWNER, { pinned: true })).items.map((i) => i.id)).toEqual(['pinned-one']);
  });

  it('excludes ARCHIVED by default, includes it with an explicit status filter', async () => {
    const { service } = makeService([makeCandidate({ id: 'active', status: 'READY' }), makeCandidate({ id: 'archived', status: 'ARCHIVED' })]);
    expect((await service.cards(OWNER, {})).items.map((i) => i.id)).toEqual(['active']);
    expect((await service.cards(OWNER, { status: 'ARCHIVED' })).items.map((i) => i.id)).toEqual(['archived']);
  });

  it('filters by date range on createdAt', async () => {
    const { service } = makeService([
      makeCandidate({ id: 'old', createdAt: new Date('2026-01-01T00:00:00.000Z') }),
      makeCandidate({ id: 'new', createdAt: new Date('2026-02-01T00:00:00.000Z') }),
    ]);
    const result = await service.cards(OWNER, { from: '2026-01-15T00:00:00.000Z' });
    expect(result.items.map((i) => i.id)).toEqual(['new']);
  });

  it('sorts by priority (default) or recent', async () => {
    const { service } = makeService([
      makeCandidate({ id: 'a', priority: 30, createdAt: new Date('2026-01-01T00:00:00.000Z') }),
      makeCandidate({ id: 'b', priority: 90, createdAt: new Date('2026-01-10T00:00:00.000Z') }),
    ]);
    expect((await service.cards(OWNER, {})).items.map((i) => i.id)).toEqual(['b', 'a']);
    expect((await service.cards(OWNER, { sort: 'recent' })).items.map((i) => i.id)).toEqual(['b', 'a']);
  });

  it('never returns another user’s candidates', async () => {
    const { service } = makeService([makeCandidate({ id: 'mine', userId: OWNER }), makeCandidate({ id: 'theirs', userId: OTHER })]);
    expect((await service.cards(OWNER, {})).items.map((i) => i.id)).toEqual(['mine']);
  });

  it('always regenerates before reading', async () => {
    const { service, generation } = makeService([]);
    await service.cards(OWNER, {});
    expect(generation.ensureGenerated).toHaveBeenCalledWith(OWNER);
  });
});

describe('InsightPresentationService — card()/setPinned() ownership', () => {
  it('card() 404s identically for a nonexistent id and another user’s candidate', async () => {
    const { service } = makeService([makeCandidate({ id: 'i1', userId: OTHER })]);
    await expect(service.card(OWNER, 'i1')).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.card(OWNER, 'nope')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('setPinned() is ownership-scoped', async () => {
    const { service } = makeService([makeCandidate({ id: 'i1', userId: OTHER })]);
    await expect(service.setPinned(OWNER, 'i1', true)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('pin then unpin toggles pinned, and pinning twice is a no-op write', async () => {
    const { service, prisma } = makeService([makeCandidate({ id: 'i1', pinned: false })]);
    const pinned = await service.setPinned(OWNER, 'i1', true);
    expect(pinned.pinned).toBe(true);

    await service.setPinned(OWNER, 'i1', true);
    expect(prisma.insightCandidate.update).toHaveBeenCalledTimes(1);

    const unpinned = await service.setPinned(OWNER, 'i1', false);
    expect(unpinned.pinned).toBe(false);
  });
});

describe('InsightPresentationService — evidence() (Phase 3/8)', () => {
  it('evidence() 404s identically for a nonexistent id and another user’s candidate', async () => {
    const { service } = makeService([makeCandidate({ id: 'i1', userId: OTHER })]);
    await expect(service.evidence(OWNER, 'i1')).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.evidence(OWNER, 'nope')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('every evidence item links back to its real reflection', async () => {
    const { service } = makeService([
      makeCandidate({ id: 'i1', evidence: [{ reflectionCandidateId: 'r1', contribution: 'y' }] }),
    ]);
    const evidence = await service.evidence(OWNER, 'i1');
    expect(evidence[0]!.href).toBe('/reflections?item=r1');
  });

  it('a JOURNAL/MEMORY source still present in the database is marked available with a real href', async () => {
    const { service } = makeService(
      [makeCandidate({ id: 'i1', evidence: [{ reflectionCandidateId: 'r1', contribution: 'y', sources: [{ sourceType: 'JOURNAL', sourceId: 'j1' }, { sourceType: 'MEMORY', sourceId: 'm1' }] }] })],
      ['j1'],
      ['m1'],
    );
    const [item] = await service.evidence(OWNER, 'i1');
    expect(item!.sources).toEqual([
      expect.objectContaining({ sourceType: 'JOURNAL', sourceId: 'j1', available: true, href: '/journal?item=j1' }),
      expect.objectContaining({ sourceType: 'MEMORY', sourceId: 'm1', available: true, href: '/memory?item=m1' }),
    ]);
  });

  it('Phase 8 — a deleted/stale JOURNAL or MEMORY source is marked unavailable with no href, never a dead link', async () => {
    const { service } = makeService(
      [makeCandidate({ id: 'i1', evidence: [{ reflectionCandidateId: 'r1', contribution: 'y', sources: [{ sourceType: 'JOURNAL', sourceId: 'deleted-journal' }] }] })],
      [], // journal id not found — deleted
      [],
    );
    const [item] = await service.evidence(OWNER, 'i1');
    expect(item!.sources[0]).toEqual(expect.objectContaining({ available: false, href: null }));
  });

  it('ACTIVITY/COMPANION sources are always available (no deletion pathway) and never linkable', async () => {
    const { service } = makeService([
      makeCandidate({ id: 'i1', evidence: [{ reflectionCandidateId: 'r1', contribution: 'y', sources: [{ sourceType: 'ACTIVITY', sourceId: 'a1' }, { sourceType: 'COMPANION', sourceId: 'c1' }] }] }),
    ]);
    const [item] = await service.evidence(OWNER, 'i1');
    for (const s of item!.sources) {
      expect(s.available).toBe(true);
      expect(s.href).toBeNull();
    }
  });
});
