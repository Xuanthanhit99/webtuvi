import { MemoryDuplicateService } from './memory-duplicate.service';

const OWNER = 'user-1';

interface MemoryOverrides {
  id: string;
  type?: string;
  title?: string;
  summary?: string;
  structuredPayload?: Record<string, unknown> | null;
  status?: string;
}

function makeMemory(o: MemoryOverrides) {
  return {
    id: o.id,
    userId: OWNER,
    type: o.type ?? 'PREFERENCE',
    title: o.title ?? 'Title',
    summary: o.summary ?? 'Summary',
    structuredPayload: o.structuredPayload ?? null,
    status: o.status ?? 'ACCEPTED',
    createdAt: new Date(),
  };
}

function makePrismaMock(memories: ReturnType<typeof makeMemory>[], existingDuplicates: Record<string, unknown>[] = []) {
  let idCounter = 0;
  const duplicates = new Map(existingDuplicates.map((d) => [(d as { id: string }).id, { ...d }]));

  return {
    memory: {
      findMany: jest.fn(async ({ where }: { where: { userId: string; status: string } }) =>
        memories.filter((m) => m.userId === where.userId && m.status === where.status),
      ),
    },
    memoryDuplicate: {
      findMany: jest.fn(async ({ where }: { where: { userId: string } }) =>
        [...duplicates.values()].filter((d) => (d as { userId: string }).userId === where.userId),
      ),
      create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
        const row = { id: `dup-${++idCounter}`, status: 'PENDING', resolvedAt: null, detectedAt: new Date(), ...data };
        duplicates.set(row.id, row);
        return row;
      }),
      update: jest.fn(async ({ where: { id }, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        const existing = duplicates.get(id)!;
        const updated = { ...existing, ...data };
        duplicates.set(id, updated);
        return updated;
      }),
      updateMany: jest.fn(async ({ where, data }: { where: Record<string, unknown>; data: Record<string, unknown> }) => {
        let count = 0;
        for (const [id, row] of duplicates) {
          const r = row as Record<string, unknown>;
          if (where.id && r.id !== where.id) continue;
          if (where.userId && r.userId !== where.userId) continue;
          if (where.status && r.status !== where.status) continue;
          if (where.memoryAId && r.memoryAId !== where.memoryAId) continue;
          if (where.memoryBId && r.memoryBId !== where.memoryBId) continue;
          duplicates.set(id, { ...r, ...data });
          count += 1;
        }
        return { count };
      }),
      deleteMany: jest.fn(async ({ where }: { where: { id: { in: string[] } } }) => {
        for (const id of where.id.in) duplicates.delete(id);
        return { count: where.id.in.length };
      }),
    },
    _duplicates: duplicates,
  };
}

describe('MemoryDuplicateService', () => {
  it('detects and persists a NORMALIZED duplicate pair', async () => {
    const memories = [
      makeMemory({ id: 'a', summary: 'I like coffee.' }),
      makeMemory({ id: 'b', summary: 'I like coffee' }),
    ];
    const prisma = makePrismaMock(memories);
    const service = new MemoryDuplicateService(prisma as never);

    const result = await service.detectForUser(OWNER);
    expect(result).toHaveLength(1);
    expect(result[0]!.matchType).toBe('NORMALIZED');
    expect(prisma.memoryDuplicate.create).toHaveBeenCalledTimes(1);
  });

  it('never flags different-type memories as duplicates', async () => {
    const memories = [
      makeMemory({ id: 'a', type: 'PREFERENCE', summary: 'I like coffee' }),
      makeMemory({ id: 'b', type: 'HABIT', summary: 'I like coffee' }),
    ];
    const prisma = makePrismaMock(memories);
    const service = new MemoryDuplicateService(prisma as never);

    const result = await service.detectForUser(OWNER);
    expect(result).toHaveLength(0);
  });

  it('does not resurrect a pair the user already dismissed', async () => {
    const memories = [
      makeMemory({ id: 'a', summary: 'I like coffee.' }),
      makeMemory({ id: 'b', summary: 'I like coffee' }),
    ];
    const existing = [
      { id: 'dup-1', userId: OWNER, memoryAId: 'a', memoryBId: 'b', matchType: 'NORMALIZED', similarity: 100, status: 'DISMISSED', detectedAt: new Date(), resolvedAt: new Date() },
    ];
    const prisma = makePrismaMock(memories, existing);
    const service = new MemoryDuplicateService(prisma as never);

    const result = await service.detectForUser(OWNER);
    expect(result).toHaveLength(0);
    expect(prisma.memoryDuplicate.create).not.toHaveBeenCalled();
  });

  it('cleans up a stale PENDING duplicate whose pair no longer matches', async () => {
    // Only memory 'a' remains ACCEPTED — 'b' has since been archived/deleted, so it's absent
    // from the ACCEPTED scan.
    const memories = [makeMemory({ id: 'a', summary: 'I like coffee' })];
    const existing = [
      { id: 'dup-1', userId: OWNER, memoryAId: 'a', memoryBId: 'b', matchType: 'NORMALIZED', similarity: 100, status: 'PENDING', detectedAt: new Date(), resolvedAt: null },
    ];
    const prisma = makePrismaMock(memories, existing);
    const service = new MemoryDuplicateService(prisma as never);

    await service.detectForUser(OWNER);
    expect(prisma.memoryDuplicate.deleteMany).toHaveBeenCalledWith({ where: { id: { in: ['dup-1'] } } });
  });

  it('markMerged/dismissPair update the row for that pair regardless of id order, scoped to the owner', async () => {
    const existing = [
      { id: 'dup-1', userId: OWNER, memoryAId: 'a', memoryBId: 'b', status: 'PENDING' },
      { id: 'dup-2', userId: 'other-user', memoryAId: 'c', memoryBId: 'd', status: 'PENDING' },
    ];
    const prisma = makePrismaMock([], existing);
    const service = new MemoryDuplicateService(prisma as never);

    await service.markMerged(OWNER, 'b', 'a'); // reversed order, still resolves to (a, b)
    expect((prisma._duplicates.get('dup-1') as { status: string }).status).toBe('MERGED');

    await service.dismissPair(OWNER, 'c', 'd'); // not owned — no-op
    expect((prisma._duplicates.get('dup-2') as { status: string }).status).toBe('PENDING');
  });
});
