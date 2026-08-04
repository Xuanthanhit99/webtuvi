import { MemoryConflictService } from './memory-conflict.service';

const OWNER = 'user-1';

interface MemoryOverrides {
  id: string;
  type?: string;
  title?: string;
  summary?: string;
  structuredPayload?: Record<string, unknown> | null;
  createdAt?: Date;
}

function makeMemory(o: MemoryOverrides) {
  return {
    id: o.id,
    userId: OWNER,
    type: o.type ?? 'LOCATION_PREFERENCE',
    title: o.title ?? 'Title',
    summary: o.summary ?? 'Summary',
    structuredPayload: o.structuredPayload ?? null,
    status: 'ACCEPTED',
    createdAt: o.createdAt ?? new Date(),
  };
}

function makePrismaMock(memories: ReturnType<typeof makeMemory>[], existing: Record<string, unknown>[] = []) {
  let idCounter = 0;
  const conflicts = new Map(existing.map((c) => [(c as { id: string }).id, { ...c }]));

  return {
    memory: {
      findMany: jest.fn(async ({ where }: { where: { userId: string; status: string } }) =>
        memories
          .filter((m) => m.userId === where.userId && m.status === where.status)
          .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
      ),
    },
    memoryConflict: {
      findMany: jest.fn(async ({ where }: { where: { userId: string } }) =>
        [...conflicts.values()].filter((c) => (c as { userId: string }).userId === where.userId),
      ),
      create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
        const row = { id: `conf-${++idCounter}`, detectedAt: new Date(), ...data };
        conflicts.set(row.id, row);
        return row;
      }),
      update: jest.fn(async ({ where: { id }, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        const existingRow = conflicts.get(id)!;
        const updated = { ...existingRow, ...data };
        conflicts.set(id, updated);
        return updated;
      }),
      deleteMany: jest.fn(async ({ where }: { where: { id: { in: string[] } } }) => {
        for (const id of where.id.in) conflicts.delete(id);
        return { count: where.id.in.length };
      }),
    },
    _conflicts: conflicts,
  };
}

describe('MemoryConflictService', () => {
  it('detects the Tokyo -> Osaka supersession example end to end', async () => {
    const memories = [
      makeMemory({ id: 'a', summary: 'I live in Tokyo', createdAt: new Date('2026-01-01') }),
      makeMemory({ id: 'b', summary: 'I moved to Osaka', createdAt: new Date('2026-06-01') }),
    ];
    const prisma = makePrismaMock(memories);
    const service = new MemoryConflictService(prisma as never);

    const result = await service.detectForUser(OWNER);
    expect(result).toHaveLength(1);
    expect(result[0]!.status).toBe('SUPERSEDED');
    expect(prisma.memoryConflict.create).toHaveBeenCalledTimes(1);
  });

  it('cleans up a stale conflict whose pair no longer applies', async () => {
    const memories = [makeMemory({ id: 'a', summary: 'I live in Tokyo' })];
    const existing = [
      { id: 'conf-1', userId: OWNER, memoryAId: 'a', memoryBId: 'b', status: 'CONFLICT', reason: 'x', detectedAt: new Date() },
    ];
    const prisma = makePrismaMock(memories, existing);
    const service = new MemoryConflictService(prisma as never);

    await service.detectForUser(OWNER);
    expect(prisma.memoryConflict.deleteMany).toHaveBeenCalledWith({ where: { id: { in: ['conf-1'] } } });
  });

  it('refreshes an existing conflict row rather than duplicating it on repeated detection', async () => {
    const memories = [
      makeMemory({ id: 'a', summary: 'I live in Tokyo', createdAt: new Date('2026-01-01') }),
      makeMemory({ id: 'b', summary: 'I moved to Osaka', createdAt: new Date('2026-06-01') }),
    ];
    const existing = [
      { id: 'conf-1', userId: OWNER, memoryAId: 'a', memoryBId: 'b', status: 'SUPERSEDED', reason: 'old reason', detectedAt: new Date() },
    ];
    const prisma = makePrismaMock(memories, existing);
    const service = new MemoryConflictService(prisma as never);

    const result = await service.detectForUser(OWNER);
    expect(result).toHaveLength(1);
    expect(prisma.memoryConflict.create).not.toHaveBeenCalled();
    expect(prisma.memoryConflict.update).toHaveBeenCalledTimes(1);
  });

  it('does not flag two unrelated, non-single-valued-type memories as conflicting', async () => {
    const memories = [
      makeMemory({ id: 'a', type: 'EMOTION', summary: 'Feeling anxious', createdAt: new Date('2026-01-01') }),
      makeMemory({ id: 'b', type: 'EMOTION', summary: 'Feeling excited', createdAt: new Date('2026-02-01') }),
    ];
    const prisma = makePrismaMock(memories);
    const service = new MemoryConflictService(prisma as never);

    const result = await service.detectForUser(OWNER);
    expect(result).toHaveLength(0);
  });
});
