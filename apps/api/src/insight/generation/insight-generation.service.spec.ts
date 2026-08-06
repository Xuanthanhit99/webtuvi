import { InsightGenerationService } from './insight-generation.service';
import { InsightPriorityService } from '../priority/insight-priority.service';
import type { PrismaService } from '../../prisma/prisma.service';
import type { ReflectionGenerationService } from '../../reflection/generation/reflection-generation.service';
import type { ReflectionValidityService } from '../../reflection/validity/reflection-validity.service';
import type { InsightDataSourceService } from '../sources/insight-data-source.service';
import type { InsightRelationshipService } from '../relationships/insight-relationship.service';
import { makeReflectionWithSources } from '../test-fixtures';
import type { InsightUserData } from '../insight.types';

const OWNER = 'user-1';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeFakePrisma() {
  let idCounter = 0;
  const candidates = new Map<string, any>();
  const evidence = new Map<string, any>();
  const relationships = new Map<string, any>();

  const impl: any = {
    insightCandidate: {
      findUnique: jest.fn(async ({ where }: any) => {
        if (where.id) return candidates.get(where.id) ?? null;
        if (where.userId_dedupeKey) {
          const { userId, dedupeKey } = where.userId_dedupeKey;
          return [...candidates.values()].find((c) => c.userId === userId && c.dedupeKey === dedupeKey) ?? null;
        }
        return null;
      }),
      findMany: jest.fn(async ({ where }: any) => {
        let rows = [...candidates.values()];
        if (where?.userId) rows = rows.filter((r) => r.userId === where.userId);
        if (where?.status?.in) rows = rows.filter((r) => where.status.in.includes(r.status));
        if (where?.dedupeKey?.notIn) rows = rows.filter((r) => !where.dedupeKey.notIn.includes(r.dedupeKey));
        return rows.map((r) => ({ ...r, evidence: [...evidence.values()].filter((e) => e.insightCandidateId === r.id) }));
      }),
      create: jest.fn(async ({ data }: any) => {
        idCounter += 1;
        const row = { id: `insight-${idCounter}`, resolvedAt: null, updatedAt: new Date(), ...data };
        candidates.set(row.id, row);
        return row;
      }),
      update: jest.fn(async ({ where: { id }, data }: any) => {
        const existing = candidates.get(id);
        const updated = { ...existing, ...data, updatedAt: new Date() };
        candidates.set(id, updated);
        return updated;
      }),
      upsert: jest.fn(async ({ where: { userId_dedupeKey }, create, update }: any) => {
        const existingRow = [...candidates.values()].find(
          (c) => c.userId === userId_dedupeKey.userId && c.dedupeKey === userId_dedupeKey.dedupeKey,
        );
        if (existingRow) {
          const updated = { ...existingRow, ...update, updatedAt: new Date() };
          candidates.set(existingRow.id, updated);
          return updated;
        }
        idCounter += 1;
        const row = { id: `insight-${idCounter}`, resolvedAt: null, updatedAt: new Date(), ...create };
        candidates.set(row.id, row);
        return row;
      }),
    },
    insightEvidence: {
      deleteMany: jest.fn(async ({ where }: any) => {
        for (const [id, row] of [...evidence.entries()]) {
          if (where.insightCandidateId && row.insightCandidateId === where.insightCandidateId) evidence.delete(id);
          if (where.id?.in && where.id.in.includes(id)) evidence.delete(id);
        }
      }),
      createMany: jest.fn(async ({ data }: any) => {
        for (const item of data) {
          idCounter += 1;
          evidence.set(`ev-${idCounter}`, { id: `ev-${idCounter}`, createdAt: new Date(), ...item });
        }
      }),
    },
    insightRelationship: {
      findMany: jest.fn(async () => [...relationships.values()]),
      updateMany: jest.fn(async ({ where, data }: any) => {
        for (const [id, row] of relationships) {
          if (where.id?.in?.includes(id)) relationships.set(id, { ...row, ...data });
        }
      }),
    },
  };
  return { impl, candidates, evidence, relationships };
}

function makeService(data: InsightUserData) {
  const { impl, candidates, evidence } = makeFakePrisma();
  const reflectionGeneration = { ensureGenerated: jest.fn().mockResolvedValue(undefined) } as unknown as ReflectionGenerationService;
  const reflectionValidity = { revalidateForUser: jest.fn().mockResolvedValue(undefined) } as unknown as ReflectionValidityService;
  const dataSource = { fetch: jest.fn().mockResolvedValue(data) } as unknown as InsightDataSourceService;
  const relationshipService = { detectForUser: jest.fn().mockResolvedValue(undefined) } as unknown as InsightRelationshipService;
  const priorityService = new InsightPriorityService();

  const service = new InsightGenerationService(impl, reflectionGeneration, reflectionValidity, dataSource, relationshipService, priorityService);
  return { service, candidates, evidence, dataSource };
}

describe('InsightGenerationService', () => {
  it('creates a singleton candidate from one strong reflection with no relationships', async () => {
    const strong = makeReflectionWithSources({ id: 'r1', score: 80, category: 'INACTIVITY' });
    const { service, candidates, evidence } = makeService({ userId: OWNER, reflections: [strong], memoryImportanceById: new Map() });
    await service.ensureGenerated(OWNER);
    expect(candidates.size).toBe(1);
    expect(evidence.size).toBe(1);
    const candidate = [...candidates.values()][0]!;
    expect(candidate.status).not.toBe('ARCHIVED');
  });

  it('does not create any candidate from a single weak reflection with no relationships', async () => {
    const weak = makeReflectionWithSources({ id: 'r1', score: 30, category: 'TOPIC' });
    const { service, candidates } = makeService({ userId: OWNER, reflections: [weak], memoryImportanceById: new Map() });
    await service.ensureGenerated(OWNER);
    expect(candidates.size).toBe(0);
  });

  it('clusters two related reflections into one candidate citing both as evidence', async () => {
    const a = makeReflectionWithSources({ id: 'r1', score: 60, category: 'GOAL', groupKey: 'GOAL:g1', trigger: 'REPEATED_GOAL', windowEnd: new Date('2026-01-01') });
    const b = makeReflectionWithSources(
      { id: 'r2', score: 60, category: 'GOAL', groupKey: 'ALIGNMENT:g1:j1', trigger: 'MEMORY_JOURNAL_ALIGNMENT', windowStart: new Date('2026-01-05'), windowEnd: new Date('2026-01-05') },
    );
    const { service, candidates, evidence } = makeService({ userId: OWNER, reflections: [a, b], memoryImportanceById: new Map() });
    // Simulate the relationship engine having already detected a SUPPORTS edge between them.
    const relRows = (service as any).prisma.insightRelationship;
    relRows.findMany.mockResolvedValueOnce([
      { id: 'rel-1', userId: OWNER, reflectionAId: 'r1', reflectionBId: 'r2', type: 'SUPPORTS', reason: 'Both relate to goal.', insightCandidateId: null },
    ]);

    await service.ensureGenerated(OWNER);

    expect(candidates.size).toBe(1);
    expect(evidence.size).toBe(2);
  });

  it('never resurrects an ARCHIVED candidate for the same dedupeKey', async () => {
    const strong = makeReflectionWithSources({ id: 'r1', score: 80, category: 'INACTIVITY' });
    const { service, candidates } = makeService({ userId: OWNER, reflections: [strong], memoryImportanceById: new Map() });
    await service.ensureGenerated(OWNER);
    const [id, row] = [...candidates.entries()][0]!;
    candidates.set(id, { ...row, status: 'ARCHIVED', resolvedAt: new Date() });

    await service.ensureGenerated(OWNER);

    expect(candidates.size).toBe(1);
    expect(candidates.get(id)!.status).toBe('ARCHIVED');
  });

  it('reconciles a stale candidate when its evidence reflection is no longer in the current fetch (expired)', async () => {
    const a = makeReflectionWithSources({ id: 'r1', score: 60, category: 'GOAL', groupKey: 'GOAL:g1', trigger: 'REPEATED_GOAL', windowEnd: new Date('2026-01-01') });
    const b = makeReflectionWithSources(
      { id: 'r2', score: 60, category: 'GOAL', groupKey: 'ALIGNMENT:g1:j1', trigger: 'MEMORY_JOURNAL_ALIGNMENT', windowStart: new Date('2026-01-05'), windowEnd: new Date('2026-01-05') },
    );
    const { service, candidates, evidence, dataSource } = makeService({ userId: OWNER, reflections: [a, b], memoryImportanceById: new Map() });
    const relRows = (service as any).prisma.insightRelationship;
    relRows.findMany.mockResolvedValue([
      { id: 'rel-1', userId: OWNER, reflectionAId: 'r1', reflectionBId: 'r2', type: 'SUPPORTS', reason: 'Both relate to goal.', insightCandidateId: null },
    ]);
    await service.ensureGenerated(OWNER);
    expect(evidence.size).toBe(2);

    // Second pass: reflection "r2" has since expired and is no longer in the fetch.
    (dataSource.fetch as jest.Mock).mockResolvedValue({ userId: OWNER, reflections: [a], memoryImportanceById: new Map() });
    relRows.findMany.mockResolvedValue([]);
    await service.ensureGenerated(OWNER);

    const remainingEvidence = [...evidence.values()];
    expect(remainingEvidence.every((e) => e.reflectionCandidateId !== 'r2')).toBe(true);

    // Regression: ruleExplanation (and category/window) must be recomputed and persisted during
    // reconciliation too, not just status/priority — otherwise the candidate keeps describing "2
    // reflections" after dropping down to 1, silently drifting out of sync with its own evidence.
    const reconciled = [...candidates.values()][0]!;
    expect(reconciled.ruleExplanation).toBe('A single strong reflection (score 60) about goal.');
  });

  it('rolls forward past an archived cluster once genuinely new evidence joins it, rather than silently discarding the new evidence', async () => {
    const older = makeReflectionWithSources({ id: 'r1', score: 80, category: 'JOURNAL', groupKey: 'JOURNAL:tag:old', trigger: 'REPEATED_JOURNAL_THEME', createdAt: new Date('2026-01-01') });
    const { service, candidates, evidence } = makeService({ userId: OWNER, reflections: [older], memoryImportanceById: new Map() });
    // First pass: a lone strong reflection seeds a singleton candidate.
    await service.ensureGenerated(OWNER);
    expect(candidates.size).toBe(1);
    const [firstId, firstRow] = [...candidates.entries()][0]!;

    // The user archives it.
    candidates.set(firstId, { ...firstRow, status: 'ARCHIVED', resolvedAt: new Date() });

    // A genuinely new, newer reflection later joins the same cluster via a SUPPORTS relationship.
    const newer = makeReflectionWithSources({ id: 'r2', score: 60, category: 'JOURNAL', groupKey: 'JOURNAL:tag:new', trigger: 'REPEATED_JOURNAL_THEME', createdAt: new Date('2026-02-01') });
    const relRows = (service as any).prisma.insightRelationship;
    relRows.findMany.mockResolvedValue([
      { id: 'rel-1', userId: OWNER, reflectionAId: 'r1', reflectionBId: 'r2', type: 'SUPPORTS', reason: 'Both relate to journal.', insightCandidateId: null },
    ]);
    (service as any).dataSource.fetch = jest.fn().mockResolvedValue({ userId: OWNER, reflections: [older, newer], memoryImportanceById: new Map() });

    await service.ensureGenerated(OWNER);

    // A fresh, non-archived candidate now exists citing the new evidence — it was not silently
    // dropped just because the cluster transitively touches an already-archived decision.
    const freshCandidates = [...candidates.values()].filter((c) => c.status !== 'ARCHIVED');
    expect(freshCandidates).toHaveLength(1);
    const freshEvidenceIds = [...evidence.values()].filter((e) => e.insightCandidateId === freshCandidates[0]!.id).map((e) => e.reflectionCandidateId);
    expect(freshEvidenceIds.sort()).toEqual(['r1', 'r2']);
  });

  it('coalesces concurrent calls for the same user into a single run instead of racing two overlapping passes', async () => {
    const strong = makeReflectionWithSources({ id: 'r1', score: 80, category: 'INACTIVITY' });
    const { service, candidates, evidence, dataSource } = makeService({ userId: OWNER, reflections: [strong], memoryImportanceById: new Map() });

    // Two callers ask for the same user's Insight Candidates at (almost) the same time — e.g. a
    // page's list + statistics requests landing together. Without single-flight coalescing, both
    // independently read-then-write the same InsightCandidate/InsightEvidence rows and collide on
    // a unique constraint (the real 500 this regression test guards against, found via this
    // sprint's own Playwright verification).
    await Promise.all([service.ensureGenerated(OWNER), service.ensureGenerated(OWNER)]);

    expect(dataSource.fetch).toHaveBeenCalledTimes(1);
    expect(candidates.size).toBe(1);
    expect(evidence.size).toBe(1);

    // A later, non-overlapping call still runs its own fresh pass (the lock only coalesces
    // genuinely concurrent callers, it never skips regeneration entirely).
    await service.ensureGenerated(OWNER);
    expect(dataSource.fetch).toHaveBeenCalledTimes(2);
  });
});
