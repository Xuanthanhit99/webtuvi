import { JournalTimelineService } from './journal-timeline.service';

const OWNER = 'user-1';

function makeEntry(overrides: { id: string; state?: string; userId?: string; createdAt: Date }) {
  return {
    id: overrides.id,
    userId: overrides.userId ?? OWNER,
    title: 'Entry',
    content: 'Content',
    state: overrides.state ?? 'PUBLISHED',
    previousState: null,
    visibility: 'PRIVATE',
    mood: null,
    tags: [],
    pinned: false,
    wordCount: 1,
    version: 1,
    sourceType: 'USER',
    sourceConversationId: null,
    sourceMessageId: null,
    createdAt: overrides.createdAt,
    updatedAt: overrides.createdAt,
    publishedAt: null,
    archivedAt: null,
    deletedAt: null,
  };
}

function makePrismaMock(entries: ReturnType<typeof makeEntry>[]) {
  return {
    journalEntry: {
      findMany: jest.fn(async ({ where, take }: { where: Record<string, unknown>; take: number }) => {
        const excluded = (where.state as { notIn: string[] }).notIn;
        const cursorFilter = (where.createdAt as { lt: Date } | undefined)?.lt;
        let rows = entries.filter((e) => e.userId === where.userId && !excluded.includes(e.state));
        if (cursorFilter) rows = rows.filter((e) => e.createdAt.getTime() < cursorFilter.getTime());
        rows = [...rows].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        return rows.slice(0, take);
      }),
    },
  };
}

describe('JournalTimelineService', () => {
  it('excludes ARCHIVED and DELETED by default', async () => {
    const entries = [
      makeEntry({ id: 'j-1', createdAt: new Date('2026-01-03T00:00:00Z') }),
      makeEntry({ id: 'j-2', state: 'ARCHIVED', createdAt: new Date('2026-01-02T00:00:00Z') }),
      makeEntry({ id: 'j-3', state: 'DELETED', createdAt: new Date('2026-01-01T00:00:00Z') }),
    ];
    const service = new JournalTimelineService(makePrismaMock(entries) as never);
    const result = await service.timeline(OWNER, {});
    expect(result.items.map((i) => i.id)).toEqual(['j-1']);
  });

  it('includes ARCHIVED when includeArchived is set, but never DELETED', async () => {
    const entries = [
      makeEntry({ id: 'j-1', createdAt: new Date('2026-01-03T00:00:00Z') }),
      makeEntry({ id: 'j-2', state: 'ARCHIVED', createdAt: new Date('2026-01-02T00:00:00Z') }),
      makeEntry({ id: 'j-3', state: 'DELETED', createdAt: new Date('2026-01-01T00:00:00Z') }),
    ];
    const service = new JournalTimelineService(makePrismaMock(entries) as never);
    const result = await service.timeline(OWNER, { includeArchived: true });
    expect(result.items.map((i) => i.id)).toEqual(['j-1', 'j-2']);
  });

  it('paginates via cursor, reverse-chronological', async () => {
    const entries = Array.from({ length: 5 }, (_, i) => makeEntry({ id: `j-${i}`, createdAt: new Date(2026, 0, i + 1) }));
    const service = new JournalTimelineService(makePrismaMock(entries) as never);

    const firstPage = await service.timeline(OWNER, { limit: 2 });
    expect(firstPage.items.map((i) => i.id)).toEqual(['j-4', 'j-3']);
    expect(firstPage.nextCursor).not.toBeNull();

    const secondPage = await service.timeline(OWNER, { limit: 2, cursor: firstPage.nextCursor! });
    expect(secondPage.items.map((i) => i.id)).toEqual(['j-2', 'j-1']);
  });

  it('groups by month with a human-readable label', async () => {
    const entries = [makeEntry({ id: 'j-1', createdAt: new Date('2026-03-15T00:00:00Z') })];
    const service = new JournalTimelineService(makePrismaMock(entries) as never);
    const result = await service.timeline(OWNER, { groupBy: 'month' });
    expect(result.items[0]!.groupKey).toBe('2026-03');
    expect(result.items[0]!.groupLabel).toContain('2026');
  });
});
