import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, csrfHeaders, extractCookie } from './utils/test-app';
import { PrismaService } from '../src/prisma/prisma.service';

// Sprint 11 — Notification & Retention Foundation e2e coverage against the real HTTP surface and a
// real Postgres instance. Mirrors this repo's established e2e discipline (unique email per test,
// identical-404 ownership checks, real state verification via direct Prisma reads). Notification
// *creation* is internal-only (scheduler/payment-webhook — see notifications-scheduler.service.spec.ts
// and payment-webhook.service.spec.ts for that coverage); this suite seeds rows directly via Prisma
// and exercises the client-facing read/preferences API surface, the same "mix of real API calls and
// direct Prisma seeding" pattern account-data-rights.e2e-spec.ts already established.

const PASSWORD = 'Sup3r$ecretPass';

function uniqueEmail(label: string): string {
  return `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

async function register(app: INestApplication, email: string): Promise<{ headers: Record<string, string>; userId: string }> {
  const res = await request(app.getHttpServer())
    .post('/auth/register')
    .send({ email, displayName: 'Notifications User', password: PASSWORD, confirmPassword: PASSWORD, acceptedTerms: true })
    .expect(201);
  const accessCookie = extractCookie(res.headers['set-cookie'], 'beaconvie_access_token')!;
  const headers = csrfHeaders(accessCookie, res.headers['set-cookie']);
  return { headers, userId: res.body.data.id as string };
}

async function seedNotification(prisma: PrismaService, userId: string, overrides: Partial<{ dedupeKey: string; readAt: Date | null }> = {}) {
  return prisma.notification.create({
    data: {
      userId,
      category: 'DISCOVERY',
      class: 'REMINDER',
      type: 'tarot.daily_reminder',
      title: "Today's card is ready",
      body: "You haven't drawn your Daily Tarot card yet today.",
      deepLink: '/discover/tarot',
      dedupeKey: overrides.dedupeKey ?? `tarot-daily-reminder:${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      readAt: overrides.readAt ?? null,
    },
  });
}

describe('Notifications (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Unauthenticated access', () => {
    it('rejects a mutating request with no CSRF token before JwtAuthGuard is even reached', async () => {
      await request(app.getHttpServer()).post('/notifications/read-all').expect(403);
    });

    it('rejects an unauthenticated list request', async () => {
      await request(app.getHttpServer()).get('/notifications').expect(401);
    });
  });

  describe('List, pagination, unread count', () => {
    it("lists only the caller's own notifications, newest first, with a correct total/page/pageSize", async () => {
      const { headers, userId } = await register(app, uniqueEmail('notif-list'));
      await seedNotification(prisma, userId);
      await seedNotification(prisma, userId);
      await seedNotification(prisma, userId);

      const res = await request(app.getHttpServer()).get('/notifications?pageSize=2').set(headers).expect(200);
      expect(res.body.data.items).toHaveLength(2);
      expect(res.body.data.total).toBe(3);
      expect(res.body.data.page).toBe(1);
      expect(res.body.data.pageSize).toBe(2);
      const createdAts = res.body.data.items.map((n: { createdAt: string }) => n.createdAt);
      expect(new Date(createdAts[0]).getTime()).toBeGreaterThanOrEqual(new Date(createdAts[1]).getTime());
    });

    it('unreadOnly=true excludes already-read notifications', async () => {
      const { headers, userId } = await register(app, uniqueEmail('notif-unread'));
      await seedNotification(prisma, userId, { readAt: new Date() });
      const unread = await seedNotification(prisma, userId);

      const res = await request(app.getHttpServer()).get('/notifications?unreadOnly=true').set(headers).expect(200);
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.items[0].id).toBe(unread.id);
    });

    it('unread-count reflects only unread rows for the caller', async () => {
      const { headers, userId } = await register(app, uniqueEmail('notif-count'));
      await seedNotification(prisma, userId);
      await seedNotification(prisma, userId, { readAt: new Date() });

      const res = await request(app.getHttpServer()).get('/notifications/unread-count').set(headers).expect(200);
      expect(res.body.data.count).toBe(1);
    });
  });

  describe('Read / read-all', () => {
    it('marks one notification read (idempotent — a second call is a safe no-op)', async () => {
      const { headers, userId } = await register(app, uniqueEmail('notif-read'));
      const notification = await seedNotification(prisma, userId);

      const first = await request(app.getHttpServer()).post(`/notifications/${notification.id}/read`).set(headers).expect(201);
      expect(first.body.data.read).toBe(true);

      const second = await request(app.getHttpServer()).post(`/notifications/${notification.id}/read`).set(headers).expect(201);
      expect(second.body.data.read).toBe(true);

      const row = await prisma.notification.findUniqueOrThrow({ where: { id: notification.id } });
      expect(row.readAt).not.toBeNull();
    });

    it('mark-all-read only affects the caller’s own unread rows', async () => {
      const { headers, userId } = await register(app, uniqueEmail('notif-readall'));
      await seedNotification(prisma, userId);
      await seedNotification(prisma, userId);

      const res = await request(app.getHttpServer()).post('/notifications/read-all').set(headers).expect(201);
      expect(res.body.data.updatedCount).toBe(2);

      const remainingUnread = await prisma.notification.count({ where: { userId, readAt: null } });
      expect(remainingUnread).toBe(0);
    });

    it('404s marking a nonexistent notification read', async () => {
      const { headers } = await register(app, uniqueEmail('notif-404'));
      await request(app.getHttpServer()).post('/notifications/does-not-exist/read').set(headers).expect(404);
    });
  });

  describe('Cross-user security (IDOR)', () => {
    it('cannot list, see, or mark-read another user’s notifications', async () => {
      const userA = await register(app, uniqueEmail('notif-a'));
      const userB = await register(app, uniqueEmail('notif-b'));
      const notification = await seedNotification(prisma, userA.userId);

      const listAsB = await request(app.getHttpServer()).get('/notifications').set(userB.headers).expect(200);
      expect(listAsB.body.data.items.find((n: { id: string }) => n.id === notification.id)).toBeUndefined();

      await request(app.getHttpServer()).post(`/notifications/${notification.id}/read`).set(userB.headers).expect(404);

      const row = await prisma.notification.findUniqueOrThrow({ where: { id: notification.id } });
      expect(row.readAt).toBeNull(); // User B's attempt must not have mutated User A's row
    });
  });

  describe('Preferences', () => {
    it('returns schema defaults for a user who has never saved preferences', async () => {
      const { headers } = await register(app, uniqueEmail('notif-prefs-default'));
      const res = await request(app.getHttpServer()).get('/notifications/preferences').set(headers).expect(200);
      expect(res.body.data).toEqual({ reminderInApp: true, reminderEmail: false });
    });

    it('persists a preference update and returns it on the next read', async () => {
      const { headers } = await register(app, uniqueEmail('notif-prefs-update'));
      const patch = await request(app.getHttpServer())
        .patch('/notifications/preferences')
        .set(headers)
        .send({ reminderInApp: false, reminderEmail: true })
        .expect(200);
      expect(patch.body.data).toEqual({ reminderInApp: false, reminderEmail: true });

      const read = await request(app.getHttpServer()).get('/notifications/preferences').set(headers).expect(200);
      expect(read.body.data).toEqual({ reminderInApp: false, reminderEmail: true });
    });

    it('a partial update leaves the other field unchanged', async () => {
      const { headers } = await register(app, uniqueEmail('notif-prefs-partial'));
      await request(app.getHttpServer()).patch('/notifications/preferences').set(headers).send({ reminderEmail: true }).expect(200);
      const res = await request(app.getHttpServer()).patch('/notifications/preferences').set(headers).send({ reminderInApp: false }).expect(200);
      expect(res.body.data).toEqual({ reminderInApp: false, reminderEmail: true });
    });
  });

  describe('Deleted user', () => {
    it('a DELETED user cannot read notifications even with a still-unexpired access token', async () => {
      const { headers, userId } = await register(app, uniqueEmail('notif-deleted'));
      await seedNotification(prisma, userId);
      await request(app.getHttpServer()).delete('/users/me').set(headers).send({ password: PASSWORD }).expect(204);

      await request(app.getHttpServer()).get('/notifications').set(headers).expect(401);
    });
  });
});
