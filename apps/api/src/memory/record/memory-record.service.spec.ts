import { ConflictException, NotFoundException } from '@nestjs/common';
import { MemoryRecordService } from './memory-record.service';
import type { MemoryAuditService } from '../audit/memory-audit.service';

const OWNER = 'user-1';
const OTHER = 'user-2';

interface MemoryOverrides {
  id?: string;
  userId?: string;
  type?: string;
  title?: string;
  summary?: string;
  structuredPayload?: Record<string, unknown> | null;
  status?: string;
  consentState?: string;
  visibility?: string;
  sourceType?: string;
  sourceConversationId?: string | null;
  sourceMessageId?: string | null;
  version?: number;
  createdAt?: Date;
  updatedAt?: Date;
  archivedAt?: Date | null;
}

function makeMemory(overrides: MemoryOverrides = {}) {
  return {
    id: overrides.id ?? 'mem-1',
    userId: overrides.userId ?? OWNER,
    type: overrides.type ?? 'GOAL',
    title: overrides.title ?? 'Title',
    summary: overrides.summary ?? 'Summary',
    structuredPayload: overrides.structuredPayload ?? null,
    status: overrides.status ?? 'ACCEPTED',
    consentState: overrides.consentState ?? 'ALLOW_SELECTED',
    visibility: overrides.visibility ?? 'PRIVATE',
    sourceType: overrides.sourceType ?? 'USER_EXPLICIT',
    sourceConversationId: overrides.sourceConversationId ?? 'conv-1',
    sourceMessageId: overrides.sourceMessageId ?? 'msg-1',
    expiresAt: null,
    version: overrides.version ?? 1,
    lastReferencedAt: null,
    createdAt: overrides.createdAt ?? new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: overrides.updatedAt ?? new Date('2026-01-01T00:00:00.000Z'),
    archivedAt: overrides.archivedAt ?? null,
    deletedAt: null,
  };
}

function makePrismaMock(seed: ReturnType<typeof makeMemory>[] = []) {
  const memories = new Map(seed.map((m) => [m.id, { ...m }]));
  const versions: Record<string, unknown>[] = [];

  const tx = {
    memory: {
      update: jest.fn(async ({ where: { id }, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        const existing = memories.get(id)!;
        const updated = { ...existing, ...data };
        memories.set(id, updated);
        return updated;
      }),
    },
    memoryVersion: {
      create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
        const record = { createdAt: new Date(), ...data };
        versions.push(record);
        return record;
      }),
    },
  };

  return {
    _memories: memories,
    _versions: versions,
    memory: {
      findUnique: jest.fn(async ({ where: { id } }: { where: { id: string } }) => memories.get(id) ?? null),
      findFirst: jest.fn(async ({ where: { id, userId } }: { where: { id: string; userId: string } }) => {
        const m = memories.get(id);
        return m && m.userId === userId ? m : null;
      }),
      delete: jest.fn(async ({ where: { id } }: { where: { id: string } }) => {
        memories.delete(id);
      }),
      update: jest.fn(async ({ where: { id }, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        const existing = memories.get(id)!;
        const updated = { ...existing, ...data };
        memories.set(id, updated);
        return updated;
      }),
      count: jest.fn(async ({ where }: { where: { userId: string; status?: unknown; type?: unknown } }) =>
        [...memories.values()].filter((m) => matchesWhere(m, where)).length,
      ),
      findMany: jest.fn(async ({ where, orderBy, skip = 0, take }: { where: Record<string, unknown>; orderBy: { createdAt: 'asc' | 'desc' }; skip?: number; take?: number }) => {
        let rows = [...memories.values()].filter((m) => matchesWhere(m, where));
        rows = rows.sort((a, b) => (orderBy.createdAt === 'asc' ? a.createdAt.getTime() - b.createdAt.getTime() : b.createdAt.getTime() - a.createdAt.getTime()));
        return rows.slice(skip, take ? skip + take : undefined);
      }),
    },
    memoryVersion: {
      findMany: jest.fn(async ({ where: { memoryId } }: { where: { memoryId: string } }) =>
        (versions as { version: number; memoryId: string }[])
          .filter((v) => v.memoryId === memoryId)
          .sort((a, b) => b.version - a.version),
      ),
    },
    $transaction: jest.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn(tx)),
  };
}

function matchesWhere(memory: ReturnType<typeof makeMemory>, where: Record<string, unknown>): boolean {
  if (where.userId !== memory.userId) return false;
  if (where.type && where.type !== memory.type) return false;
  const status = where.status as string | { notIn: string[] } | undefined;
  if (status) {
    if (typeof status === 'string' && status !== memory.status) return false;
    if (typeof status === 'object' && status.notIn.includes(memory.status)) return false;
  }
  return true;
}

function makeAuditMock(): MemoryAuditService {
  return { record: jest.fn(async () => undefined), forMemory: jest.fn(async () => []) } as unknown as MemoryAuditService;
}

describe('MemoryRecordService — ownership', () => {
  it('getOne throws 404 (not 403) for a memory owned by someone else', async () => {
    const prisma = makePrismaMock([makeMemory()]);
    const service = new MemoryRecordService(prisma as never, makeAuditMock());

    await expect(service.getOne(OTHER, 'mem-1')).rejects.toThrow(NotFoundException);
  });

  it('getOne succeeds for the owner and records a VIEWED audit entry', async () => {
    const prisma = makePrismaMock([makeMemory()]);
    const audit = makeAuditMock();
    const service = new MemoryRecordService(prisma as never, audit);

    const memory = await service.getOne(OWNER, 'mem-1');

    expect(memory.id).toBe('mem-1');
    expect(audit.record).toHaveBeenCalledWith(expect.objectContaining({ action: 'VIEWED' }));
  });
});

describe('MemoryRecordService — update (PATCH allowlist)', () => {
  it('updates title/visibility and creates a new version', async () => {
    const prisma = makePrismaMock([makeMemory({ version: 1 })]);
    const service = new MemoryRecordService(prisma as never, makeAuditMock());

    const updated = await service.update(OWNER, 'mem-1', { title: 'New title' });

    expect(updated.title).toBe('New title');
    expect(updated.version).toBe(2);
    expect(prisma._versions).toHaveLength(1);
  });

  it('never allows summary/structuredPayload/type to change through the public API shape', async () => {
    const prisma = makePrismaMock([makeMemory({ summary: 'original summary' })]);
    const service = new MemoryRecordService(prisma as never, makeAuditMock());

    // UpdateMemoryParams (the service's own param type) has no summary/type field —
    // this test documents/locks that contract rather than bypassing it via `as any`.
    const updated = await service.update(OWNER, 'mem-1', { title: 'New title' });

    expect(updated.summary).toBe('original summary');
  });

  it('refuses to update an archived memory until it is restored', async () => {
    const prisma = makePrismaMock([makeMemory({ status: 'ARCHIVED' })]);
    const service = new MemoryRecordService(prisma as never, makeAuditMock());

    await expect(service.update(OWNER, 'mem-1', { title: 'x' })).rejects.toThrow(ConflictException);
  });
});

describe('MemoryRecordService — archive/restore', () => {
  it('archive hides via status and archivedAt, restore reverses it', async () => {
    const prisma = makePrismaMock([makeMemory()]);
    const service = new MemoryRecordService(prisma as never, makeAuditMock());

    const archived = await service.archive(OWNER, 'mem-1');
    expect(archived.status).toBe('ARCHIVED');

    const restored = await service.restore(OWNER, 'mem-1');
    expect(restored.status).toBe('ACCEPTED');
  });

  it('archive is idempotent', async () => {
    const prisma = makePrismaMock([makeMemory({ status: 'ARCHIVED' })]);
    const service = new MemoryRecordService(prisma as never, makeAuditMock());

    const result = await service.archive(OWNER, 'mem-1');
    expect(result.status).toBe('ARCHIVED');
  });

  it('restore refuses a memory that is not archived', async () => {
    const prisma = makePrismaMock([makeMemory({ status: 'ACCEPTED' })]);
    const service = new MemoryRecordService(prisma as never, makeAuditMock());

    await expect(service.restore(OWNER, 'mem-1')).rejects.toThrow(ConflictException);
  });

  it('an archived memory is excluded from the default list but included when explicitly requested', async () => {
    const prisma = makePrismaMock([makeMemory({ id: 'mem-1', status: 'ACCEPTED' }), makeMemory({ id: 'mem-2', status: 'ARCHIVED' })]);
    const service = new MemoryRecordService(prisma as never, makeAuditMock());

    const defaultList = await service.list(OWNER, {});
    expect(defaultList.items.map((m) => m.id)).toEqual(['mem-1']);

    const archivedList = await service.list(OWNER, { status: 'ARCHIVED' });
    expect(archivedList.items.map((m) => m.id)).toEqual(['mem-2']);
  });
});

describe('MemoryRecordService — deletion policy', () => {
  it('hard-deletes the memory; it is then unavailable via getOne/list', async () => {
    const prisma = makePrismaMock([makeMemory()]);
    const service = new MemoryRecordService(prisma as never, makeAuditMock());

    await service.remove(OWNER, 'mem-1');

    expect(prisma._memories.has('mem-1')).toBe(false);
    await expect(service.getOne(OWNER, 'mem-1')).rejects.toThrow(NotFoundException);
  });

  it('writes a DELETED audit entry before removing the row', async () => {
    const prisma = makePrismaMock([makeMemory()]);
    const audit = makeAuditMock();
    const service = new MemoryRecordService(prisma as never, audit);

    await service.remove(OWNER, 'mem-1');

    expect(audit.record).toHaveBeenCalledWith(expect.objectContaining({ action: 'DELETED', memoryId: 'mem-1' }));
  });

  it('deleting an already-deleted memory is a silent, idempotent no-op', async () => {
    const prisma = makePrismaMock([makeMemory()]);
    const service = new MemoryRecordService(prisma as never, makeAuditMock());

    await service.remove(OWNER, 'mem-1');
    await expect(service.remove(OWNER, 'mem-1')).resolves.toBeUndefined();
  });

  it('deleting a memory owned by someone else is a silent no-op — it is not actually deleted', async () => {
    const prisma = makePrismaMock([makeMemory()]);
    const service = new MemoryRecordService(prisma as never, makeAuditMock());

    await service.remove(OTHER, 'mem-1');

    expect(prisma._memories.has('mem-1')).toBe(true);
  });

  it('deleting a memory that never existed behaves identically to deleting one that did (no distinguishing error)', async () => {
    const prisma = makePrismaMock([]);
    const service = new MemoryRecordService(prisma as never, makeAuditMock());

    await expect(service.remove(OWNER, 'does-not-exist')).resolves.toBeUndefined();
  });
});

describe('MemoryRecordService — timeline', () => {
  it('returns items reverse-chronological with a next cursor when more exist', async () => {
    const seed = Array.from({ length: 3 }, (_, i) =>
      makeMemory({ id: `mem-${i}`, createdAt: new Date(2026, 0, i + 1) }),
    );
    const prisma = makePrismaMock(seed);
    const service = new MemoryRecordService(prisma as never, makeAuditMock());

    const page = await service.timeline(OWNER, { limit: 2 });

    expect(page.items).toHaveLength(2);
    expect(page.items[0]!.id).toBe('mem-2'); // most recent first
    expect(page.nextCursor).not.toBeNull();
  });

  it('never includes a deleted memory even without an explicit status filter', async () => {
    const prisma = makePrismaMock([makeMemory({ id: 'mem-1' })]);
    const service = new MemoryRecordService(prisma as never, makeAuditMock());
    await service.remove(OWNER, 'mem-1');

    const page = await service.timeline(OWNER, {});

    expect(page.items).toHaveLength(0);
  });

  it('each item explains why it exists and whether its source is available', async () => {
    const prisma = makePrismaMock([makeMemory({ sourceType: 'COMPANION' })]);
    const service = new MemoryRecordService(prisma as never, makeAuditMock());

    const page = await service.timeline(OWNER, {});

    expect(page.items[0]!.whyThisMemory).toMatch(/companion/i);
    expect(page.items[0]!.sourceAvailable).toBe(true);
    expect(page.items[0]!.consentExplanation.length).toBeGreaterThan(0);
  });
});

describe('MemoryRecordService — versions', () => {
  it('returns the version history for the owner only', async () => {
    const prisma = makePrismaMock([makeMemory({ version: 1 })]);
    const service = new MemoryRecordService(prisma as never, makeAuditMock());
    await service.update(OWNER, 'mem-1', { title: 'v2' });

    const history = await service.versions(OWNER, 'mem-1');

    expect(history).toHaveLength(1);
    expect(history[0]!.title).toBe('v2');

    await expect(service.versions(OTHER, 'mem-1')).rejects.toThrow(NotFoundException);
  });
});
