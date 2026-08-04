import { NotFoundException } from '@nestjs/common';
import { ImportanceScoringService } from './importance-scoring.service';

const OWNER = 'user-1';

interface MemoryOverrides {
  id?: string;
  userId?: string;
  type?: string;
  title?: string;
  summary?: string;
  structuredPayload?: Record<string, unknown> | null;
  status?: string;
  sourceType?: string;
  pinned?: boolean;
  importanceScore?: number;
  importanceFactors?: Record<string, unknown> | null;
  createdAt?: Date;
  lastReferencedAt?: Date | null;
}

function makeMemory(overrides: MemoryOverrides = {}) {
  return {
    id: overrides.id ?? 'mem-1',
    userId: overrides.userId ?? OWNER,
    type: overrides.type ?? 'CUSTOM',
    title: overrides.title ?? 'Title',
    summary: overrides.summary ?? 'Summary',
    structuredPayload: overrides.structuredPayload ?? null,
    status: overrides.status ?? 'ACCEPTED',
    sourceType: overrides.sourceType ?? 'USER_EXPLICIT',
    pinned: overrides.pinned ?? false,
    importanceScore: overrides.importanceScore ?? 0,
    importanceFactors: overrides.importanceFactors ?? null,
    createdAt: overrides.createdAt ?? new Date(),
    lastReferencedAt: overrides.lastReferencedAt ?? null,
  };
}

function makePrismaMock(seed: ReturnType<typeof makeMemory>[]) {
  const memories = new Map(seed.map((m) => [m.id, { ...m }]));
  return {
    memory: {
      findFirst: jest.fn(async ({ where }: { where: { id: string; userId: string } }) => {
        const m = memories.get(where.id);
        return m && m.userId === where.userId ? m : null;
      }),
      findMany: jest.fn(async ({ where }: { where: Record<string, unknown> }) => {
        return [...memories.values()].filter((m) => {
          if (where.userId && m.userId !== where.userId) return false;
          if (where.status && m.status !== where.status) return false;
          const idFilter = where.id as { not?: string } | undefined;
          if (idFilter?.not && m.id === idFilter.not) return false;
          return true;
        });
      }),
      update: jest.fn(async ({ where: { id }, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        const existing = memories.get(id)!;
        const updated = { ...existing, ...data };
        memories.set(id, updated);
        return updated;
      }),
    },
    _memories: memories,
  };
}

describe('ImportanceScoringService', () => {
  it('throws MEMORY_NOT_FOUND for a memory that does not exist or is not owned', async () => {
    const prisma = makePrismaMock([makeMemory({ id: 'mem-1', userId: OWNER })]);
    const service = new ImportanceScoringService(prisma as never);

    await expect(service.recompute('someone-else', 'mem-1')).rejects.toThrow(NotFoundException);
    await expect(service.recompute(OWNER, 'missing')).rejects.toThrow(NotFoundException);
  });

  it('persists a computed score and factor breakdown, and returns an explanation', async () => {
    const prisma = makePrismaMock([makeMemory({ id: 'mem-1', type: 'GOAL', sourceType: 'USER_EXPLICIT' })]);
    const service = new ImportanceScoringService(prisma as never);

    const result = await service.recompute(OWNER, 'mem-1');

    expect(result.score).toBeGreaterThan(0);
    expect(result.explanations.length).toBeGreaterThan(0);
    expect(prisma._memories.get('mem-1')!.importanceScore).toBe(result.score);
    expect(prisma._memories.get('mem-1')!.importanceFactors).toEqual(result.factors);
  });

  it('counts recurrence from other same-type memories with significant token overlap', async () => {
    const prisma = makePrismaMock([
      makeMemory({ id: 'mem-1', type: 'PREFERENCE', title: 'Coffee', summary: 'I like drinking coffee every morning' }),
      makeMemory({ id: 'mem-2', type: 'PREFERENCE', title: 'Coffee love', summary: 'I love drinking coffee every day' }),
      makeMemory({ id: 'mem-3', type: 'EMOTION', title: 'Unrelated', summary: 'Feeling anxious about exams' }),
    ]);
    const service = new ImportanceScoringService(prisma as never);

    const result = await service.recompute(OWNER, 'mem-1');
    expect(result.factors.recurrence).toBeGreaterThan(0);
  });

  it('recomputeAllForUser updates every ACCEPTED memory and skips others', async () => {
    const prisma = makePrismaMock([
      makeMemory({ id: 'mem-1', status: 'ACCEPTED' }),
      makeMemory({ id: 'mem-2', status: 'ACCEPTED' }),
      makeMemory({ id: 'mem-3', status: 'ARCHIVED' }),
    ]);
    const service = new ImportanceScoringService(prisma as never);

    const count = await service.recomputeAllForUser(OWNER);
    expect(count).toBe(2);
    expect(prisma._memories.get('mem-3')!.importanceScore).toBe(0);
  });

  it('gives a pinned memory an explanation mentioning the pin', async () => {
    const prisma = makePrismaMock([makeMemory({ id: 'mem-1', pinned: true })]);
    const service = new ImportanceScoringService(prisma as never);

    const result = await service.recompute(OWNER, 'mem-1');
    expect(result.explanations.some((text) => text.toLowerCase().includes('pinned'))).toBe(true);
  });
});
