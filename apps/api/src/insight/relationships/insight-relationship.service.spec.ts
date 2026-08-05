import { InsightRelationshipService } from './insight-relationship.service';
import type { PrismaService } from '../../prisma/prisma.service';
import { makeReflection } from '../test-fixtures';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeFakePrisma(existing: any[] = []) {
  const rows = new Map(existing.map((r) => [r.id, r]));
  let idCounter = 0;
  return {
    rows,
    insightRelationship: {
      findMany: jest.fn(async () => [...rows.values()]),
      create: jest.fn(async ({ data }: any) => {
        idCounter += 1;
        const row = { id: `rel-${idCounter}`, detectedAt: new Date(), insightCandidateId: null, ...data };
        rows.set(row.id, row);
        return row;
      }),
      update: jest.fn(async ({ where: { id }, data }: any) => {
        const updated = { ...rows.get(id), ...data };
        rows.set(id, updated);
        return updated;
      }),
      upsert: jest.fn(async ({ where: { reflectionAId_reflectionBId }, create, update }: any) => {
        const existingRow = [...rows.values()].find(
          (r) => r.reflectionAId === reflectionAId_reflectionBId.reflectionAId && r.reflectionBId === reflectionAId_reflectionBId.reflectionBId,
        );
        if (existingRow) {
          const updated = { ...existingRow, ...update };
          rows.set(existingRow.id, updated);
          return updated;
        }
        idCounter += 1;
        const row = { id: `rel-${idCounter}`, detectedAt: new Date(), insightCandidateId: null, ...create };
        rows.set(row.id, row);
        return row;
      }),
      deleteMany: jest.fn(async ({ where }: any) => {
        for (const [id] of [...rows.entries()]) {
          if (where.id?.in?.includes(id)) rows.delete(id);
        }
      }),
    },
  };
}

describe('InsightRelationshipService', () => {
  it('creates a relationship row for a related pair', async () => {
    const a = makeReflection({ id: 'r1', category: 'GOAL', groupKey: 'GOAL:g1', trigger: 'REPEATED_GOAL', windowEnd: new Date('2026-01-01'), score: 40 });
    const b = makeReflection({ id: 'r2', category: 'GOAL', groupKey: 'GOAL:g1', trigger: 'REPEATED_GOAL', windowStart: new Date('2026-01-10'), windowEnd: new Date('2026-01-10'), score: 40 });
    const prisma = makeFakePrisma();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const service = new InsightRelationshipService(prisma as unknown as PrismaService);

    await service.detectForUser('user-1', [a, b]);

    expect(prisma.insightRelationship.upsert).toHaveBeenCalledTimes(1);
    expect([...prisma.rows.values()][0]!.type).toBe('STAGNATES');
  });

  it('does not create a row for an unrelated pair', async () => {
    const a = makeReflection({ id: 'r1', category: 'TOPIC', groupKey: 'TOPIC:a' });
    const b = makeReflection({ id: 'r2', category: 'GOAL', groupKey: 'GOAL:b' });
    const prisma = makeFakePrisma();
    const service = new InsightRelationshipService(prisma as unknown as PrismaService);

    await service.detectForUser('user-1', [a, b]);

    expect(prisma.insightRelationship.upsert).not.toHaveBeenCalled();
  });

  it('removes a stale relationship row that no longer matches on a later pass', async () => {
    const existing = [{ id: 'rel-1', userId: 'user-1', reflectionAId: 'r1', reflectionBId: 'r2', type: 'STAGNATES', reason: 'old', detectedAt: new Date(), insightCandidateId: null }];
    const prisma = makeFakePrisma(existing);
    const service = new InsightRelationshipService(prisma as unknown as PrismaService);

    // Neither reflection passed this time -> no current matches -> the stale row is removed.
    await service.detectForUser('user-1', []);

    expect(prisma.insightRelationship.deleteMany).toHaveBeenCalledWith({ where: { id: { in: ['rel-1'] } } });
  });
});
