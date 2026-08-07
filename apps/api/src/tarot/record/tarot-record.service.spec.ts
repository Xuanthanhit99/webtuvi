import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TarotRecordService } from './tarot-record.service';
import type { TarotInterpretationService } from '../interpretation/tarot-interpretation.service';
import type { MemoryRetrievalService } from '../../memory/retrieval/memory-retrieval.service';

const OWNER = 'user-1';
const OTHER = 'user-2';

function makeReading(overrides: { id?: string; userId?: string; status?: string; type?: string; createdAt?: Date } = {}) {
  return {
    id: overrides.id ?? 'reading-1',
    userId: overrides.userId ?? OWNER,
    type: overrides.type ?? 'SINGLE_CARD',
    spreadId: 'spread-1',
    status: overrides.status ?? 'ACTIVE',
    visibility: 'COMPANION_VISIBLE',
    question: null,
    interpretation: 'A moment worth sitting with.',
    createdAt: overrides.createdAt ?? new Date('2026-01-05T00:00:00.000Z'),
    updatedAt: new Date('2026-01-05T00:00:00.000Z'),
    archivedAt: null,
    deletedAt: null,
    spread: { id: 'spread-1', slug: 'single-card', name: 'Single Card', cardCount: 1, positions: [{ order: 0, label: 'Focus' }] },
    cards: [],
  };
}

type Row = ReturnType<typeof makeReading>;

function makePrismaMock(seed: Row[] = []) {
  const rows = new Map(seed.map((r) => [r.id, r]));
  const history: { id: string; readingId: string; action: string; detail: string; createdAt: Date }[] = [];
  let counter = 0;

  return {
    tarotReading: {
      findUnique: jest.fn(async ({ where: { id } }: { where: { id: string } }) => rows.get(id) ?? null),
      findUniqueOrThrow: jest.fn(async ({ where: { id } }: { where: { id: string } }) => {
        const row = rows.get(id);
        if (!row) throw new Error('not found');
        return row;
      }),
      findFirst: jest.fn(async ({ where }: { where: { userId: string; type: string; createdAt?: { gte: Date } } }) =>
        [...rows.values()].find((r) => r.userId === where.userId && r.type === where.type && (!where.createdAt || r.createdAt >= where.createdAt.gte)) ?? null,
      ),
      count: jest.fn(async () => rows.size),
      findMany: jest.fn(async () => [...rows.values()]),
      update: jest.fn(async ({ where: { id }, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        const existing = rows.get(id)!;
        const updated = { ...existing, ...data };
        rows.set(id, updated);
        return updated;
      }),
    },
    tarotReadingHistory: {
      create: jest.fn(async ({ data }: { data: { readingId: string; action: string; detail: string } }) => {
        const entry = { id: `h${counter++}`, ...data, createdAt: new Date() };
        history.push(entry);
        return entry;
      }),
      findMany: jest.fn(async ({ where: { readingId } }: { where: { readingId: string } }) => history.filter((h) => h.readingId === readingId)),
    },
  };
}

function makeService(seed: Row[] = []) {
  const prisma = makePrismaMock(seed);
  const interpretation = { interpret: jest.fn().mockResolvedValue(null) } as unknown as TarotInterpretationService;
  const memoryRetrieval = { recommend: jest.fn().mockResolvedValue({ items: [] }) } as unknown as MemoryRetrievalService;
  const service = new TarotRecordService(prisma as never, interpretation, memoryRetrieval);
  return { service, prisma };
}

describe('TarotRecordService — ownership', () => {
  it('getOne/history/archive/restore/remove 404 identically for a nonexistent id and another user’s reading', async () => {
    const { service } = makeService([makeReading({ id: 'r1', userId: OTHER })]);
    await expect(service.getOne(OWNER, 'r1')).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.getOne(OWNER, 'does-not-exist')).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.history(OWNER, 'r1')).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.archive(OWNER, 'r1')).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.restore(OWNER, 'r1')).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.remove(OWNER, 'r1')).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('TarotRecordService — lifecycle transitions', () => {
  it('archive only succeeds from ACTIVE', async () => {
    const { service } = makeService([makeReading({ id: 'r1', status: 'ACTIVE' })]);
    const result = await service.archive(OWNER, 'r1');
    expect(result.status).toBe('ARCHIVED');
  });

  it('archive rejects a reading that is already archived', async () => {
    const { service } = makeService([makeReading({ id: 'r1', status: 'ARCHIVED' })]);
    await expect(service.archive(OWNER, 'r1')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('restore is rejected on an already-ACTIVE reading', async () => {
    const { service } = makeService([makeReading({ id: 'r1', status: 'ACTIVE' })]);
    await expect(service.restore(OWNER, 'r1')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('archive then restore returns to ACTIVE', async () => {
    const { service } = makeService([makeReading({ id: 'r1', status: 'ACTIVE' })]);
    await service.archive(OWNER, 'r1');
    const restored = await service.restore(OWNER, 'r1');
    expect(restored.status).toBe('ACTIVE');
  });

  it('remove is rejected on an already-deleted reading', async () => {
    const { service } = makeService([makeReading({ id: 'r1', status: 'DELETED' })]);
    await expect(service.remove(OWNER, 'r1')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('delete then restore returns to ACTIVE', async () => {
    const { service } = makeService([makeReading({ id: 'r1', status: 'ACTIVE' })]);
    await service.remove(OWNER, 'r1');
    const restored = await service.restore(OWNER, 'r1');
    expect(restored.status).toBe('ACTIVE');
  });
});

describe('TarotRecordService — Daily Draw rate limit (Phase 9 security fix)', () => {
  it('a second Daily Draw the same UTC day is rejected even if the first was deleted', async () => {
    const { service, prisma } = makeService([
      makeReading({ id: 'r1', type: 'DAILY_DRAW', status: 'DELETED', createdAt: new Date() }),
    ]);
    // draw() itself needs a real spread/card lookup we haven't mocked here — assert the guard
    // rejects before any of that by checking the thrown error directly.
    await expect(service.draw(OWNER, { type: 'DAILY_DRAW' })).rejects.toMatchObject({
      response: { code: 'TAROT_DAILY_DRAW_ALREADY_TAKEN' },
    });
    expect(prisma.tarotReading.findFirst).toHaveBeenCalled();
  });
});
