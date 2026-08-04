import { ConflictException, NotFoundException } from '@nestjs/common';
import { JournalRecordService } from './journal-record.service';

const OWNER = 'user-1';
const OTHER = 'user-2';

interface JournalOverrides {
  id?: string;
  userId?: string;
  title?: string;
  content?: string;
  state?: string;
  previousState?: string | null;
  visibility?: string;
  mood?: string | null;
  tags?: string[];
  pinned?: boolean;
  wordCount?: number;
  version?: number;
  sourceType?: string;
  sourceConversationId?: string | null;
  sourceMessageId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  publishedAt?: Date | null;
  archivedAt?: Date | null;
  deletedAt?: Date | null;
}

function makeEntry(overrides: JournalOverrides = {}) {
  return {
    id: overrides.id ?? 'j-1',
    userId: overrides.userId ?? OWNER,
    title: overrides.title ?? 'A good day',
    content: overrides.content ?? 'Today was nice.',
    state: overrides.state ?? 'DRAFT',
    previousState: overrides.previousState ?? null,
    visibility: overrides.visibility ?? 'PRIVATE',
    mood: overrides.mood ?? null,
    tags: overrides.tags ?? [],
    pinned: overrides.pinned ?? false,
    wordCount: overrides.wordCount ?? 3,
    version: overrides.version ?? 1,
    sourceType: overrides.sourceType ?? 'USER',
    sourceConversationId: overrides.sourceConversationId ?? null,
    sourceMessageId: overrides.sourceMessageId ?? null,
    createdAt: overrides.createdAt ?? new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: overrides.updatedAt ?? new Date('2026-01-01T00:00:00.000Z'),
    publishedAt: overrides.publishedAt ?? null,
    archivedAt: overrides.archivedAt ?? null,
    deletedAt: overrides.deletedAt ?? null,
  };
}

function makePrismaMock(seed: ReturnType<typeof makeEntry>[] = []) {
  const entries = new Map(seed.map((e) => [e.id, { ...e }]));
  const revisions: Record<string, unknown>[] = [];

  const tx = {
    journalEntry: {
      create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
        const record = makeEntry({ id: (data.id as string) ?? `j-${entries.size + 1}`, ...data } as JournalOverrides);
        entries.set(record.id, record);
        return record;
      }),
      update: jest.fn(async ({ where: { id }, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        const existing = entries.get(id)!;
        const updated = { ...existing, ...data };
        entries.set(id, updated);
        return updated;
      }),
    },
    journalRevision: {
      create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
        const record = { createdAt: new Date(), ...data };
        revisions.push(record);
        return record;
      }),
    },
  };

  return {
    _entries: entries,
    _revisions: revisions,
    journalEntry: {
      create: tx.journalEntry.create,
      findUnique: jest.fn(async ({ where: { id } }: { where: { id: string } }) => entries.get(id) ?? null),
      update: tx.journalEntry.update,
      count: jest.fn(async ({ where }: { where: Record<string, unknown> }) => [...entries.values()].filter((e) => matchesWhere(e, where)).length),
      findMany: jest.fn(
        async ({
          where,
          orderBy,
          skip = 0,
          take,
        }: {
          where: Record<string, unknown>;
          orderBy: Record<string, 'asc' | 'desc'>;
          skip?: number;
          take?: number;
        }) => {
          let rows = [...entries.values()].filter((e) => matchesWhere(e, where));
          const [field, dir] = Object.entries(orderBy)[0]!;
          rows = rows.sort((a, b) => {
            const av = (a[field as keyof typeof a] as Date).getTime();
            const bv = (b[field as keyof typeof b] as Date).getTime();
            return dir === 'asc' ? av - bv : bv - av;
          });
          return rows.slice(skip, take ? skip + take : undefined);
        },
      ),
    },
    journalRevision: {
      create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
        const record = { createdAt: new Date(), ...data };
        revisions.push(record);
        return record;
      }),
      findMany: jest.fn(async ({ where: { journalId } }: { where: { journalId: string } }) =>
        (revisions as { version: number; journalId: string }[]).filter((r) => r.journalId === journalId).sort((a, b) => b.version - a.version),
      ),
    },
    $transaction: jest.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn(tx)),
  };
}

function matchesWhere(entry: ReturnType<typeof makeEntry>, where: Record<string, unknown>): boolean {
  if (where.userId !== entry.userId) return false;
  const state = where.state as string | { notIn: string[] } | undefined;
  if (state) {
    if (typeof state === 'string' && state !== entry.state) return false;
    if (typeof state === 'object' && state.notIn.includes(entry.state)) return false;
  }
  if (where.mood && where.mood !== entry.mood) return false;
  if (where.pinned !== undefined && where.pinned !== entry.pinned) return false;
  const tagFilter = where.tags as { has: string } | undefined;
  if (tagFilter && !entry.tags.includes(tagFilter.has)) return false;
  const q = where.OR as { title?: { contains: string }; content?: { contains: string } }[] | undefined;
  if (q) {
    const needle = (q[0]!.title ?? q[1]!.content)!.contains.toLowerCase();
    const matched = entry.title.toLowerCase().includes(needle) || entry.content.toLowerCase().includes(needle);
    if (!matched) return false;
  }
  return true;
}

describe('JournalRecordService — ownership', () => {
  it('getOne throws 404 (not 403) for an entry owned by someone else', async () => {
    const prisma = makePrismaMock([makeEntry()]);
    const service = new JournalRecordService(prisma as never);
    await expect(service.getOne(OTHER, 'j-1')).rejects.toThrow(NotFoundException);
  });

  it('getOne throws an identical 404 for a nonexistent id', async () => {
    const prisma = makePrismaMock([]);
    const service = new JournalRecordService(prisma as never);
    await expect(service.getOne(OWNER, 'does-not-exist')).rejects.toThrow(NotFoundException);
  });

  it('getOne succeeds for the owner, even for an archived or deleted entry', async () => {
    const prisma = makePrismaMock([makeEntry({ state: 'DELETED' })]);
    const service = new JournalRecordService(prisma as never);
    const entry = await service.getOne(OWNER, 'j-1');
    expect(entry.state).toBe('DELETED');
  });

  it('update/archive/restore/remove/duplicate/revisions all throw 404 for a non-owner', async () => {
    const prisma = makePrismaMock([makeEntry()]);
    const service = new JournalRecordService(prisma as never);
    await expect(service.update(OTHER, 'j-1', { title: 'x' })).rejects.toThrow(NotFoundException);
    await expect(service.archive(OTHER, 'j-1')).rejects.toThrow(NotFoundException);
    await expect(service.restore(OTHER, 'j-1')).rejects.toThrow(NotFoundException);
    await expect(service.remove(OTHER, 'j-1')).rejects.toThrow(NotFoundException);
    await expect(service.duplicate(OTHER, 'j-1')).rejects.toThrow(NotFoundException);
    await expect(service.revisions(OTHER, 'j-1')).rejects.toThrow(NotFoundException);
  });
});

describe('JournalRecordService — create', () => {
  it('always creates a DRAFT with a first revision', async () => {
    const prisma = makePrismaMock();
    const service = new JournalRecordService(prisma as never);
    const entry = await service.create(OWNER, { title: 'My day', content: 'It was fine.' });

    expect(entry.state).toBe('DRAFT');
    expect(entry.version).toBe(1);
    expect(entry.wordCount).toBe(3);
    expect(prisma._revisions).toHaveLength(1);
    expect(prisma._revisions[0]).toMatchObject({ version: 1, changeReason: 'created' });
  });

  it('allows an empty/omitted title — /journal/new creates a real row before the user has typed anything', async () => {
    const prisma = makePrismaMock();
    const service = new JournalRecordService(prisma as never);
    const entry = await service.create(OWNER, { title: '', content: '' });
    expect(entry.title).toBe('');
    expect(entry.state).toBe('DRAFT');

    const withoutTitleAtAll = await service.create(OWNER, {});
    expect(withoutTitleAtAll.title).toBe('');
  });

  it('a Companion-sourced entry carries sourceType/sourceConversationId/sourceMessageId', async () => {
    const prisma = makePrismaMock();
    const service = new JournalRecordService(prisma as never);
    const entry = await service.create(
      OWNER,
      { title: 'From chat', content: 'Something reflective.' },
      { sourceType: 'COMPANION_SUGGESTED', sourceConversationId: 'conv-1', sourceMessageId: 'msg-1' },
    );
    expect(entry.sourceType).toBe('COMPANION_SUGGESTED');
    expect(entry.sourceConversationId).toBe('conv-1');
  });
});

describe('JournalRecordService — draft system (autosave vs. explicit save)', () => {
  it('autosave updates content but never creates a revision or bumps version', async () => {
    const prisma = makePrismaMock([makeEntry()]);
    const service = new JournalRecordService(prisma as never);

    const result = await service.autosave(OWNER, 'j-1', { content: 'Today was nice, and then...' });

    expect(result.entry.content).toBe('Today was nice, and then...');
    expect(result.entry.version).toBe(1);
    expect(prisma._revisions).toHaveLength(0);
    expect(result.savedAt).toBeTruthy();
  });

  it('autosave is rejected once the entry is no longer a draft', async () => {
    const prisma = makePrismaMock([makeEntry({ state: 'PUBLISHED' })]);
    const service = new JournalRecordService(prisma as never);
    await expect(service.autosave(OWNER, 'j-1', { content: 'x' })).rejects.toThrow(ConflictException);
  });

  it('an explicit update() with changed content DOES create a revision and bumps version', async () => {
    const prisma = makePrismaMock([makeEntry()]);
    const service = new JournalRecordService(prisma as never);

    const updated = await service.update(OWNER, 'j-1', { content: 'Completely different text.' });

    expect(updated.version).toBe(2);
    expect(prisma._revisions).toHaveLength(1);
    expect(prisma._revisions[0]).toMatchObject({ version: 2, changeReason: 'edited' });
  });

  it('update() with no actual change is a no-op — no revision, same version', async () => {
    const prisma = makePrismaMock([makeEntry()]);
    const service = new JournalRecordService(prisma as never);

    const updated = await service.update(OWNER, 'j-1', { title: 'A good day' });

    expect(updated.version).toBe(1);
    expect(prisma._revisions).toHaveLength(0);
  });

  it('never silently discards writing — update() persists content even without publishing', async () => {
    const prisma = makePrismaMock([makeEntry()]);
    const service = new JournalRecordService(prisma as never);
    const updated = await service.update(OWNER, 'j-1', { content: 'Recovered draft text.' });
    expect(updated.content).toBe('Recovered draft text.');
    expect(updated.state).toBe('DRAFT');
  });
});

describe('JournalRecordService — publish', () => {
  it('DRAFT -> PUBLISHED sets publishedAt and always creates a revision', async () => {
    const prisma = makePrismaMock([makeEntry()]);
    const service = new JournalRecordService(prisma as never);

    const published = await service.publish(OWNER, 'j-1');

    expect(published.state).toBe('PUBLISHED');
    expect(published.publishedAt).not.toBeNull();
    expect(prisma._revisions).toHaveLength(1);
  });

  it('publishing an already-published entry is rejected', async () => {
    const prisma = makePrismaMock([makeEntry({ state: 'PUBLISHED' })]);
    const service = new JournalRecordService(prisma as never);
    await expect(service.publish(OWNER, 'j-1')).rejects.toThrow(ConflictException);
  });
});

describe('JournalRecordService — lifecycle (archive/restore/soft-delete)', () => {
  it('archive is reversible and idempotent', async () => {
    const prisma = makePrismaMock([makeEntry({ state: 'PUBLISHED' })]);
    const service = new JournalRecordService(prisma as never);

    const archived = await service.archive(OWNER, 'j-1');
    expect(archived.state).toBe('ARCHIVED');

    const archivedAgain = await service.archive(OWNER, 'j-1');
    expect(archivedAgain.state).toBe('ARCHIVED');
  });

  it('restore returns an archived entry to exactly its previous state', async () => {
    const prisma = makePrismaMock([makeEntry({ state: 'ARCHIVED', previousState: 'PUBLISHED' })]);
    const service = new JournalRecordService(prisma as never);

    const restored = await service.restore(OWNER, 'j-1');
    expect(restored.state).toBe('PUBLISHED');
  });

  it('soft-delete never removes the row — restore recovers it to its state beforehand', async () => {
    const prisma = makePrismaMock([makeEntry({ state: 'DRAFT' })]);
    const service = new JournalRecordService(prisma as never);

    const deleted = await service.remove(OWNER, 'j-1');
    expect(deleted.state).toBe('DELETED');
    expect(prisma._entries.get('j-1')).toBeDefined(); // still exists — soft delete, not a real DELETE

    const restored = await service.restore(OWNER, 'j-1');
    expect(restored.state).toBe('DRAFT');
  });

  it('remove() is idempotent for an already-deleted entry', async () => {
    const prisma = makePrismaMock([makeEntry({ state: 'DELETED' })]);
    const service = new JournalRecordService(prisma as never);
    const result = await service.remove(OWNER, 'j-1');
    expect(result.state).toBe('DELETED');
  });

  it('editing an archived or deleted entry is rejected until restored', async () => {
    const prisma = makePrismaMock([makeEntry({ state: 'ARCHIVED' }), makeEntry({ id: 'j-2', state: 'DELETED' })]);
    const service = new JournalRecordService(prisma as never);
    await expect(service.update(OWNER, 'j-1', { title: 'x' })).rejects.toThrow(ConflictException);
    await expect(service.update(OWNER, 'j-2', { title: 'x' })).rejects.toThrow(ConflictException);
  });
});

describe('JournalRecordService — duplicate', () => {
  it('always creates a fresh DRAFT copy, regardless of the source entry’s own state', async () => {
    const prisma = makePrismaMock([makeEntry({ state: 'PUBLISHED', title: 'Original', tags: ['a', 'b'] })]);
    const service = new JournalRecordService(prisma as never);

    const copy = await service.duplicate(OWNER, 'j-1');
    expect(copy.state).toBe('DRAFT');
    expect(copy.title).toBe('Original (copy)');
    expect(copy.tags).toEqual(['a', 'b']);
    expect(copy.id).not.toBe('j-1');
  });

  it('duplicating a deleted entry is rejected until restored', async () => {
    const prisma = makePrismaMock([makeEntry({ state: 'DELETED' })]);
    const service = new JournalRecordService(prisma as never);
    await expect(service.duplicate(OWNER, 'j-1')).rejects.toThrow(ConflictException);
  });
});

describe('JournalRecordService — list, filter, and search', () => {
  it('excludes DELETED and ARCHIVED entries by default', async () => {
    const prisma = makePrismaMock([
      makeEntry({ id: 'j-1', state: 'PUBLISHED' }),
      makeEntry({ id: 'j-2', state: 'DELETED' }),
      makeEntry({ id: 'j-3', state: 'ARCHIVED' }),
    ]);
    const service = new JournalRecordService(prisma as never);
    const result = await service.list(OWNER, {});
    expect(result.items.map((i) => i.id)).toEqual(['j-1']);
  });

  it('an explicit state filter still reaches archived or deleted entries', async () => {
    const prisma = makePrismaMock([makeEntry({ id: 'j-1', state: 'PUBLISHED' }), makeEntry({ id: 'j-2', state: 'ARCHIVED' })]);
    const service = new JournalRecordService(prisma as never);
    const result = await service.list(OWNER, { state: 'ARCHIVED' as never });
    expect(result.items.map((i) => i.id)).toEqual(['j-2']);
  });

  it('filters by mood, tag, and pinned', async () => {
    const prisma = makePrismaMock([
      makeEntry({ id: 'j-1', mood: 'GOOD', tags: ['travel'], pinned: true }),
      makeEntry({ id: 'j-2', mood: 'LOW', tags: ['work'], pinned: false }),
    ]);
    const service = new JournalRecordService(prisma as never);

    expect((await service.list(OWNER, { mood: 'GOOD' as never })).items.map((i) => i.id)).toEqual(['j-1']);
    expect((await service.list(OWNER, { tag: 'work' })).items.map((i) => i.id)).toEqual(['j-2']);
    expect((await service.list(OWNER, { pinned: true })).items.map((i) => i.id)).toEqual(['j-1']);
  });

  it('deterministic search (q) matches title or content, case-insensitively', async () => {
    const prisma = makePrismaMock([
      makeEntry({ id: 'j-1', title: 'Marathon training', content: 'Ran 5 miles.' }),
      makeEntry({ id: 'j-2', title: 'Grocery list', content: 'Eggs, milk.' }),
    ]);
    const service = new JournalRecordService(prisma as never);
    const result = await service.list(OWNER, { q: 'marathon' });
    expect(result.items.map((i) => i.id)).toEqual(['j-1']);
  });

  it('never returns another user’s entries', async () => {
    const prisma = makePrismaMock([makeEntry({ id: 'j-1', userId: OWNER }), makeEntry({ id: 'j-2', userId: OTHER })]);
    const service = new JournalRecordService(prisma as never);
    const result = await service.list(OWNER, {});
    expect(result.items.map((i) => i.id)).toEqual(['j-1']);
  });
});

describe('JournalRecordService — revision history', () => {
  it('records a version snapshot per meaningful edit and lists them newest-first', async () => {
    const prisma = makePrismaMock([makeEntry()]);
    const service = new JournalRecordService(prisma as never);

    await service.update(OWNER, 'j-1', { content: 'First real edit.' });
    await service.update(OWNER, 'j-1', { content: 'Second real edit.' });

    const revisions = await service.revisions(OWNER, 'j-1');
    expect(revisions.map((r) => r.version)).toEqual([3, 2]);
  });
});
