import { ReflectionGenerationService } from './reflection-generation.service';
import { ReflectionScoreService } from '../scoring/reflection-score.service';
import type { PrismaService } from '../../prisma/prisma.service';
import type { ReflectionDataSourceService } from '../sources/reflection-data-source.service';
import type { ReflectionRuleEngine } from '../rules/reflection-rule-engine.service';
import type { ReflectionRuleFinding } from '../reflection.types';
import { makeUserData } from '../test-fixtures';

const OWNER = 'user-1';

type Row = Record<string, unknown>;

interface InListFilter {
  in: string[];
}

function makeFakePrisma() {
  let idCounter = 0;
  const candidates = new Map<string, Row>();
  const sources = new Map<string, Row[]>();

  const base = {
    reflectionCandidate: {
      findMany: jest.fn(
        async ({ where }: { where?: { userId?: string; dedupeKey?: InListFilter; trigger?: InListFilter; state?: InListFilter } }) => {
          let rows = [...candidates.values()];
          if (where?.userId) rows = rows.filter((r) => r.userId === where.userId);
          if (where?.dedupeKey) rows = rows.filter((r) => where.dedupeKey!.in.includes(r.dedupeKey as string));
          if (where?.trigger) rows = rows.filter((r) => where.trigger!.in.includes(r.trigger as string));
          if (where?.state) rows = rows.filter((r) => where.state!.in.includes(r.state as string));
          return rows.map((r) => ({ ...r }));
        },
      ),
      create: jest.fn(async ({ data }: { data: Row }) => {
        idCounter += 1;
        const row: Row = { id: `gen-${idCounter}`, resolvedAt: null, expiredAt: null, updatedAt: new Date(), ...data };
        candidates.set(row.id as string, row);
        return row;
      }),
      update: jest.fn(async ({ where: { id }, data }: { where: { id: string }; data: Row }) => {
        const existing = candidates.get(id)!;
        const updated = { ...existing, ...data, updatedAt: new Date() };
        candidates.set(id, updated);
        return updated;
      }),
      updateMany: jest.fn(async ({ where, data }: { where: { id: InListFilter }; data: Row }) => {
        const rows = [...candidates.values()].filter((r) => where.id.in.includes(r.id as string));
        for (const row of rows) candidates.set(row.id as string, { ...row, ...data });
        return { count: rows.length };
      }),
    },
    reflectionSourceRef: {
      deleteMany: jest.fn(async ({ where: { reflectionCandidateId } }: { where: { reflectionCandidateId: string } }) => {
        sources.delete(reflectionCandidateId);
      }),
      createMany: jest.fn(async ({ data }: { data: Row[] }) => {
        for (const item of data) {
          const key = item.reflectionCandidateId as string;
          const list = sources.get(key) ?? [];
          list.push(item);
          sources.set(key, list);
        }
      }),
    },
  };
  type FakePrisma = typeof base & { $transaction: (fn: (tx: FakePrisma) => Promise<unknown>) => Promise<unknown> };
  const transact = async (fn: (tx: FakePrisma) => Promise<unknown>): Promise<unknown> => fn(impl);
  const impl: FakePrisma = { ...base, $transaction: jest.fn(transact) };
  return { impl, candidates, sources };
}

function makeFinding(overrides: Partial<ReflectionRuleFinding> = {}): ReflectionRuleFinding {
  return {
    trigger: overrides.trigger ?? 'REPEATED_TOPIC',
    category: overrides.category ?? 'TOPIC',
    window: overrides.window ?? 'WEEK',
    windowStart: overrides.windowStart ?? new Date('2026-01-01'),
    windowEnd: overrides.windowEnd ?? new Date('2026-01-05'),
    reason: overrides.reason ?? 'You mentioned this a few times.',
    groupKey: overrides.groupKey ?? 'TOPIC:example',
    sources: overrides.sources ?? [{ sourceType: 'JOURNAL', sourceId: 'j1', sourceTimestamp: new Date('2026-01-01') }],
    scoreHints: overrides.scoreHints ?? { importanceScore: null, isGoalRelevant: false, hasActivitySource: false, journalSourceCount: 1 },
  };
}

function makeService(findings: ReflectionRuleFinding[]) {
  const { impl, candidates } = makeFakePrisma();
  const dataSource = { fetch: jest.fn().mockResolvedValue(makeUserData()) } as unknown as ReflectionDataSourceService;
  const ruleEngine = { run: jest.fn().mockReturnValue(findings) } as unknown as ReflectionRuleEngine;
  const scoreService = new ReflectionScoreService();
  const service = new ReflectionGenerationService(impl as unknown as PrismaService, dataSource, ruleEngine, scoreService);
  return { service, candidates, ruleEngine };
}

describe('ReflectionGenerationService', () => {
  it('creates a new candidate for a fresh finding', async () => {
    const { service, candidates } = makeService([makeFinding()]);
    await service.ensureGenerated(OWNER);
    expect(candidates.size).toBe(1);
    const row = [...candidates.values()][0]!;
    expect(row.userId).toBe(OWNER);
    expect(row.state).toBe('READY');
  });

  it('updates the same candidate in place on a second pass with the same dedupeKey (no duplicate row)', async () => {
    const finding = makeFinding();
    const { service, candidates } = makeService([finding]);
    await service.ensureGenerated(OWNER);
    await service.ensureGenerated(OWNER);
    expect(candidates.size).toBe(1);
  });

  it('never resurrects a DISMISSED candidate for the same dedupeKey', async () => {
    const finding = makeFinding();
    const { service, candidates } = makeService([finding]);
    await service.ensureGenerated(OWNER);
    const [id, row] = [...candidates.entries()][0]!;
    candidates.set(id, { ...row, state: 'DISMISSED', resolvedAt: new Date() });

    await service.ensureGenerated(OWNER);

    expect(candidates.size).toBe(1);
    expect(candidates.get(id)!.state).toBe('DISMISSED');
  });

  it('never resurrects an ARCHIVED candidate for the same dedupeKey', async () => {
    const finding = makeFinding();
    const { service, candidates } = makeService([finding]);
    await service.ensureGenerated(OWNER);
    const [id, row] = [...candidates.entries()][0]!;
    candidates.set(id, { ...row, state: 'ARCHIVED', resolvedAt: new Date() });

    await service.ensureGenerated(OWNER);

    expect(candidates.get(id)!.state).toBe('ARCHIVED');
  });

  it('expires a stale LONG_INACTIVITY candidate once the rule no longer fires', async () => {
    const inactivityFinding = makeFinding({ trigger: 'LONG_INACTIVITY', category: 'INACTIVITY', groupKey: `INACTIVITY:${OWNER}` });
    const { service, candidates, ruleEngine } = makeService([inactivityFinding]);
    await service.ensureGenerated(OWNER);
    expect(candidates.size).toBe(1);
    const id = [...candidates.keys()][0]!;
    expect(candidates.get(id)!.state).toBe('READY');

    // Second pass: the rule engine now finds nothing (user became active again).
    (ruleEngine.run as jest.Mock).mockReturnValue([]);
    await service.ensureGenerated(OWNER);

    expect(candidates.get(id)!.state).toBe('EXPIRED');
    expect(candidates.get(id)!.expiredAt).not.toBeNull();
  });
});
