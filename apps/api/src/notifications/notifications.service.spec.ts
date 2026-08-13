import { NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { NotificationsService } from './notifications.service';

const USER_ID = 'user-1';

function uniqueConstraintError() {
  return Object.assign(new Prisma.PrismaClientKnownRequestError('Unique constraint failed', { code: 'P2002', clientVersion: '5.22.0' }), {
    code: 'P2002',
  });
}

function makeRow(overrides: Partial<{ id: string; userId: string; dedupeKey: string; readAt: Date | null }> = {}) {
  return {
    id: overrides.id ?? 'notif-1',
    userId: overrides.userId ?? USER_ID,
    category: 'DISCOVERY',
    class: 'REMINDER',
    type: 'tarot.daily_reminder',
    title: "Today's card is ready",
    body: 'Body',
    deepLink: '/discover/tarot',
    dedupeKey: overrides.dedupeKey ?? 'tarot-daily-reminder:2026-08-13',
    readAt: overrides.readAt === undefined ? null : overrides.readAt,
    createdAt: new Date('2026-08-13T09:00:00.000Z'),
    emailStatus: 'SKIPPED',
    emailAttemptedAt: null,
    emailError: null,
  };
}

function makePrismaMock() {
  const rows = new Map<string, ReturnType<typeof makeRow>>();
  const notification = {
    create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
      const existing = [...rows.values()].find((r) => r.userId === data.userId && r.dedupeKey === data.dedupeKey);
      if (existing) throw uniqueConstraintError();
      const row = makeRow({ id: `notif-${rows.size + 1}`, userId: data.userId as string, dedupeKey: data.dedupeKey as string });
      Object.assign(row, data);
      rows.set(row.id, row);
      return row;
    }),
    findUniqueOrThrow: jest.fn(async ({ where }: { where: { userId_dedupeKey?: { userId: string; dedupeKey: string }; id?: string } }) => {
      if (where.userId_dedupeKey) {
        const found = [...rows.values()].find((r) => r.userId === where.userId_dedupeKey!.userId && r.dedupeKey === where.userId_dedupeKey!.dedupeKey);
        if (!found) throw new Error('not found');
        return found;
      }
      const found = rows.get(where.id!);
      if (!found) throw new Error('not found');
      return found;
    }),
    findUnique: jest.fn(async ({ where }: { where: { id: string } }) => rows.get(where.id) ?? null),
    findMany: jest.fn(async ({ where, skip, take }: { where: { userId: string; readAt?: null }; skip: number; take: number }) => {
      let items = [...rows.values()].filter((r) => r.userId === where.userId);
      if (where.readAt === null) items = items.filter((r) => r.readAt === null);
      items = items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      return items.slice(skip, skip + take);
    }),
    count: jest.fn(async ({ where }: { where: { userId: string; readAt?: null } }) => {
      let items = [...rows.values()].filter((r) => r.userId === where.userId);
      if (where.readAt === null) items = items.filter((r) => r.readAt === null);
      return items.length;
    }),
    update: jest.fn(async ({ where, data }: { where: { id: string }; data: Partial<ReturnType<typeof makeRow>> }) => {
      const row = rows.get(where.id)!;
      Object.assign(row, data);
      return row;
    }),
    updateMany: jest.fn(async ({ where, data }: { where: { userId: string; readAt: null }; data: { readAt: Date } }) => {
      const targets = [...rows.values()].filter((r) => r.userId === where.userId && r.readAt === null);
      targets.forEach((r) => Object.assign(r, data));
      return { count: targets.length };
    }),
  };
  return { notification, rows };
}

describe('NotificationsService.create — idempotency', () => {
  it('creates a new notification with the correct category/class derived from its type', async () => {
    const { notification } = makePrismaMock();
    const service = new NotificationsService({ notification } as never);

    const result = await service.create({
      userId: USER_ID,
      type: 'tarot.daily_reminder',
      title: 'T',
      body: 'B',
      deepLink: '/discover/tarot',
      dedupeKey: 'tarot-daily-reminder:2026-08-13',
    });

    expect(result.created).toBe(true);
    expect(result.notification.category).toBe('DISCOVERY');
    expect(result.notification.class).toBe('REMINDER');
  });

  it('a duplicate (userId, dedupeKey) create is a safe idempotent no-op, returning the existing row', async () => {
    const { notification } = makePrismaMock();
    const service = new NotificationsService({ notification } as never);
    const input = { userId: USER_ID, type: 'tarot.daily_reminder' as const, title: 'T', body: 'B', dedupeKey: 'tarot-daily-reminder:2026-08-13' };

    const first = await service.create(input);
    const second = await service.create(input);

    expect(first.created).toBe(true);
    expect(second.created).toBe(false);
    expect(second.notification.id).toBe(first.notification.id);
    expect(notification.create).toHaveBeenCalledTimes(2); // both attempts really hit the DB
  });

  it('two different users can each have a notification with the identical dedupeKey (scoped per-user)', async () => {
    const { notification } = makePrismaMock();
    const service = new NotificationsService({ notification } as never);
    const dedupeKey = 'tarot-daily-reminder:2026-08-13';

    const a = await service.create({ userId: 'user-a', type: 'tarot.daily_reminder', title: 'T', body: 'B', dedupeKey });
    const b = await service.create({ userId: 'user-b', type: 'tarot.daily_reminder', title: 'T', body: 'B', dedupeKey });

    expect(a.created).toBe(true);
    expect(b.created).toBe(true);
  });

  it('rethrows a non-P2002 error rather than treating every failure as a duplicate', async () => {
    const { notification } = makePrismaMock();
    notification.create.mockRejectedValueOnce(new Error('connection lost'));
    const service = new NotificationsService({ notification } as never);

    await expect(
      service.create({ userId: USER_ID, type: 'tarot.daily_reminder', title: 'T', body: 'B', dedupeKey: 'k' }),
    ).rejects.toThrow('connection lost');
  });
});

describe('NotificationsService.list', () => {
  it('paginates, newest first, scoped to the caller', async () => {
    const { notification, rows } = makePrismaMock();
    for (let i = 0; i < 3; i++) {
      rows.set(`n${i}`, makeRow({ id: `n${i}`, dedupeKey: `k${i}` }));
    }
    const service = new NotificationsService({ notification } as never);

    const result = await service.list(USER_ID, { page: 1, pageSize: 2 });
    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(3);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(2);
  });

  it('unreadOnly filters out read notifications', async () => {
    const { notification, rows } = makePrismaMock();
    rows.set('read', makeRow({ id: 'read', dedupeKey: 'k1', readAt: new Date() }));
    rows.set('unread', makeRow({ id: 'unread', dedupeKey: 'k2' }));
    const service = new NotificationsService({ notification } as never);

    const result = await service.list(USER_ID, { unreadOnly: true });
    expect(result.items.map((i) => i.id)).toEqual(['unread']);
  });
});

describe('NotificationsService.unreadCount / markRead / markAllRead', () => {
  it('unreadCount counts only unread rows for the caller', async () => {
    const { notification, rows } = makePrismaMock();
    rows.set('read', makeRow({ id: 'read', dedupeKey: 'k1', readAt: new Date() }));
    rows.set('unread', makeRow({ id: 'unread', dedupeKey: 'k2' }));
    const service = new NotificationsService({ notification } as never);

    await expect(service.unreadCount(USER_ID)).resolves.toBe(1);
  });

  it('markRead is idempotent — a second call on an already-read notification does not re-write it', async () => {
    const { notification, rows } = makePrismaMock();
    rows.set('n1', makeRow({ id: 'n1', dedupeKey: 'k1' }));
    const service = new NotificationsService({ notification } as never);

    const first = await service.markRead(USER_ID, 'n1');
    expect(first.read).toBe(true);
    expect(notification.update).toHaveBeenCalledTimes(1);

    const second = await service.markRead(USER_ID, 'n1');
    expect(second.read).toBe(true);
    expect(notification.update).toHaveBeenCalledTimes(1); // not called again — already read
  });

  it('markRead 404s for a notification owned by a different user (IDOR-safe)', async () => {
    const { notification, rows } = makePrismaMock();
    rows.set('n1', makeRow({ id: 'n1', userId: 'someone-else', dedupeKey: 'k1' }));
    const service = new NotificationsService({ notification } as never);

    await expect(service.markRead(USER_ID, 'n1')).rejects.toThrow(NotFoundException);
  });

  it('markRead 404s for a nonexistent notification', async () => {
    const { notification } = makePrismaMock();
    const service = new NotificationsService({ notification } as never);
    await expect(service.markRead(USER_ID, 'does-not-exist')).rejects.toThrow(NotFoundException);
  });

  it('markAllRead only updates the caller’s own unread rows and reports the real count', async () => {
    const { notification, rows } = makePrismaMock();
    rows.set('a', makeRow({ id: 'a', dedupeKey: 'k1' }));
    rows.set('b', makeRow({ id: 'b', dedupeKey: 'k2' }));
    rows.set('c', makeRow({ id: 'c', userId: 'someone-else', dedupeKey: 'k3' }));
    const service = new NotificationsService({ notification } as never);

    const result = await service.markAllRead(USER_ID);
    expect(result.updatedCount).toBe(2);
    expect(rows.get('c')!.readAt).toBeNull(); // untouched — different user
  });
});
