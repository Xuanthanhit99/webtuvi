import { ConflictException, NotFoundException } from '@nestjs/common';
import { MemoryMergeSuggestionService } from './memory-merge-suggestion.service';
import type { MemoryDuplicatePairDto } from '../duplicate/memory-duplicate.service';

const OWNER = 'user-1';

interface MemoryOverrides {
  id: string;
  title?: string;
  importanceScore?: number;
  pinned?: boolean;
  createdAt?: Date;
}

function makeMemory(o: MemoryOverrides) {
  return {
    id: o.id,
    userId: OWNER,
    title: o.title ?? `Memory ${o.id}`,
    importanceScore: o.importanceScore ?? 0,
    pinned: o.pinned ?? false,
    createdAt: o.createdAt ?? new Date('2026-01-01'),
  };
}

function makePrismaMock(memories: ReturnType<typeof makeMemory>[], existingSuggestions: Record<string, unknown>[] = []) {
  let idCounter = 0;
  const suggestions = new Map(existingSuggestions.map((s) => [(s as { id: string }).id, { ...s }]));

  const api = {
    memory: {
      findMany: jest.fn(async ({ where }: { where: { id: { in: string[] }; userId: string } }) =>
        memories.filter((m) => where.id.in.includes(m.id) && m.userId === where.userId),
      ),
    },
    memoryMergeSuggestion: {
      findMany: jest.fn(async ({ where }: { where: { userId: string; status?: string } }) =>
        [...suggestions.values()].filter((s) => {
          const r = s as Record<string, unknown>;
          if (r.userId !== where.userId) return false;
          if (where.status && r.status !== where.status) return false;
          return true;
        }),
      ),
      findFirst: jest.fn(async ({ where }: { where: { id?: string; userId: string; OR?: Record<string, string>[] } }) => {
        return (
          [...suggestions.values()].find((s) => {
            const r = s as Record<string, unknown>;
            if (r.userId !== where.userId) return false;
            if (where.id) return r.id === where.id;
            if (where.OR) {
              return where.OR.some(
                (clause) => r.primaryMemoryId === clause.primaryMemoryId && r.duplicateMemoryId === clause.duplicateMemoryId,
              );
            }
            return true;
          }) ?? null
        );
      }),
      findUniqueOrThrow: jest.fn(async ({ where: { id } }: { where: { id: string } }) => {
        const row = suggestions.get(id);
        if (!row) throw new Error('not found');
        return row;
      }),
      create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
        const row = { id: `sug-${++idCounter}`, status: 'PENDING', resolvedAt: null, createdAt: new Date(), ...data };
        suggestions.set(row.id, row);
        return row;
      }),
      update: jest.fn(async ({ where: { id }, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        const existing = suggestions.get(id)!;
        const updated = { ...existing, ...data };
        suggestions.set(id, updated);
        return updated;
      }),
    },
    _suggestions: suggestions,
  };
  return {
    ...api,
    $transaction: jest.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn(api)),
  };
}

function makeDuplicatesMock(pairs: MemoryDuplicatePairDto[] = []) {
  return {
    detectForUser: jest.fn(async () => pairs),
    markMerged: jest.fn(async () => undefined),
    dismissPair: jest.fn(async () => undefined),
  };
}

function makeRecordsMock() {
  return { archive: jest.fn(async () => undefined) };
}

function makePair(overrides: Partial<MemoryDuplicatePairDto> = {}): MemoryDuplicatePairDto {
  return {
    id: 'dup-1',
    memoryAId: 'a',
    memoryBId: 'b',
    matchType: 'NORMALIZED',
    similarity: 100,
    reason: 'They say the same thing.',
    status: 'PENDING',
    detectedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('MemoryMergeSuggestionService', () => {
  it('creates a suggestion for a pending duplicate pair, choosing the higher-importance memory as primary', async () => {
    const memories = [makeMemory({ id: 'a', importanceScore: 30 }), makeMemory({ id: 'b', importanceScore: 80 })];
    const prisma = makePrismaMock(memories);
    const duplicates = makeDuplicatesMock([makePair()]);
    const records = makeRecordsMock();
    const service = new MemoryMergeSuggestionService(prisma as never, duplicates as never, records as never);

    const result = await service.generateForUser(OWNER);
    expect(result).toHaveLength(1);
    expect(result[0]!.primaryMemoryId).toBe('b'); // higher importanceScore wins
    expect(result[0]!.duplicateMemoryId).toBe('a');
    expect(result[0]!.confidence).toBe(95); // NORMALIZED
  });

  it('does not create a second suggestion for a pair that already has one', async () => {
    const memories = [makeMemory({ id: 'a' }), makeMemory({ id: 'b' })];
    const existing = [{ id: 'sug-1', userId: OWNER, primaryMemoryId: 'b', duplicateMemoryId: 'a', confidence: 95, reason: 'x', status: 'PENDING', createdAt: new Date() }];
    const prisma = makePrismaMock(memories, existing);
    const duplicates = makeDuplicatesMock([makePair()]);
    const records = makeRecordsMock();
    const service = new MemoryMergeSuggestionService(prisma as never, duplicates as never, records as never);

    await service.generateForUser(OWNER);
    expect(prisma.memoryMergeSuggestion.create).not.toHaveBeenCalled();
  });

  it('accept() marks the suggestion ACCEPTED, merges the duplicate, and archives it — never deletes', async () => {
    const memories = [makeMemory({ id: 'a' }), makeMemory({ id: 'b' })];
    const existing = [{ id: 'sug-1', userId: OWNER, primaryMemoryId: 'b', duplicateMemoryId: 'a', confidence: 95, reason: 'x', status: 'PENDING', createdAt: new Date() }];
    const prisma = makePrismaMock(memories, existing);
    const duplicates = makeDuplicatesMock();
    const records = makeRecordsMock();
    const service = new MemoryMergeSuggestionService(prisma as never, duplicates as never, records as never);

    const result = await service.accept(OWNER, 'sug-1');
    expect(result.status).toBe('ACCEPTED');
    expect(duplicates.markMerged).toHaveBeenCalledWith(OWNER, 'b', 'a');
    expect(records.archive).toHaveBeenCalledWith(OWNER, 'a');
  });

  it('reject() marks the suggestion REJECTED and dismisses the underlying duplicate pair', async () => {
    const memories = [makeMemory({ id: 'a' }), makeMemory({ id: 'b' })];
    const existing = [{ id: 'sug-1', userId: OWNER, primaryMemoryId: 'b', duplicateMemoryId: 'a', confidence: 95, reason: 'x', status: 'PENDING', createdAt: new Date() }];
    const prisma = makePrismaMock(memories, existing);
    const duplicates = makeDuplicatesMock();
    const records = makeRecordsMock();
    const service = new MemoryMergeSuggestionService(prisma as never, duplicates as never, records as never);

    const result = await service.reject(OWNER, 'sug-1');
    expect(result.status).toBe('REJECTED');
    expect(duplicates.dismissPair).toHaveBeenCalledWith(OWNER, 'b', 'a');
    expect(records.archive).not.toHaveBeenCalled();
  });

  it('throws NotFoundException for a suggestion that does not exist or is not owned', async () => {
    const prisma = makePrismaMock([], [{ id: 'sug-1', userId: 'someone-else', primaryMemoryId: 'a', duplicateMemoryId: 'b', status: 'PENDING' }]);
    const service = new MemoryMergeSuggestionService(prisma as never, makeDuplicatesMock() as never, makeRecordsMock() as never);

    await expect(service.accept(OWNER, 'sug-1')).rejects.toThrow(NotFoundException);
    await expect(service.accept(OWNER, 'missing')).rejects.toThrow(NotFoundException);
  });

  it('throws ConflictException when accepting/rejecting an already-resolved suggestion', async () => {
    const existing = [{ id: 'sug-1', userId: OWNER, primaryMemoryId: 'a', duplicateMemoryId: 'b', status: 'ACCEPTED' }];
    const prisma = makePrismaMock([], existing);
    const service = new MemoryMergeSuggestionService(prisma as never, makeDuplicatesMock() as never, makeRecordsMock() as never);

    await expect(service.accept(OWNER, 'sug-1')).rejects.toThrow(ConflictException);
    await expect(service.reject(OWNER, 'sug-1')).rejects.toThrow(ConflictException);
  });
});
