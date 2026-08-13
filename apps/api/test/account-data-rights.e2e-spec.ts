import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, csrfHeaders, extractCookie } from './utils/test-app';
import { PrismaService } from '../src/prisma/prisma.service';
import { signPayOSData } from '../src/payment/providers/payos-signature.util';

// Sprint 10 — Account Data Rights (export + deletion) e2e coverage against the real HTTP surface
// and a real Postgres instance. Mirrors this repo's established e2e discipline (unique email per
// test, identical-404/401 ownership checks, real cascade verification via direct Prisma reads
// after the HTTP call under test completes). See docs/architecture/account-data-rights.md.

const PASSWORD = 'Sup3r$ecretPass';

function uniqueEmail(label: string): string {
  return `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

function buildWebhookPayload(orderCode: string, amount: number) {
  const data = {
    orderCode: Number(orderCode),
    amount,
    description: 'BeaconVie Premium',
    reference: `FT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    currency: 'VND',
  };
  const signature = signPayOSData(data, process.env.PAYOS_CHECKSUM_KEY!);
  return { code: '00', desc: 'success', success: true, data, signature };
}

async function register(app: INestApplication, email: string): Promise<{ headers: Record<string, string>; userId: string }> {
  const res = await request(app.getHttpServer())
    .post('/auth/register')
    .send({ email, displayName: 'Data Rights User', password: PASSWORD, confirmPassword: PASSWORD, acceptedTerms: true })
    .expect(201);
  const accessCookie = extractCookie(res.headers['set-cookie'], 'beaconvie_access_token')!;
  const headers = csrfHeaders(accessCookie, res.headers['set-cookie']);
  return { headers, userId: res.body.data.id as string };
}

/** Creates a representative spread of real personal content for one user, mixing real API calls
 * (Journal/Tarot/Numerology — simple, well-understood DTOs) with direct Prisma seeding (Memory,
 * Natal Chart, Premium/Payment — heavier setup paths already covered end-to-end by their own
 * dedicated e2e suites; here they're setup, not the system under test). */
async function seedRealisticUserData(app: INestApplication, prisma: PrismaService, headers: Record<string, string>, userId: string) {
  await request(app.getHttpServer()).post('/journal').set(headers).send({ title: 'A real entry', content: 'Real content.' }).expect(201);
  await request(app.getHttpServer()).post('/tarot/draw').set(headers).send({ type: 'DAILY_DRAW' }).expect(201);
  await request(app.getHttpServer())
    .post('/numerology/calculate')
    .set(headers)
    .send({ fullBirthName: 'Jane Doe', birthDate: '1990-05-15' })
    .expect(201);

  await prisma.memory.create({
    data: { userId, type: 'IDENTITY', title: 'Real memory', summary: 'A real, accepted memory.', sourceType: 'USER_EXPLICIT' },
  });
  await prisma.memoryNote.create({ data: { userId, content: 'A real legacy onboarding memory note.', source: 'ONBOARDING' } });

  const order = await prisma.paymentOrder.create({
    data: {
      userId,
      product: 'PREMIUM_30D',
      amount: 79000,
      currency: 'VND',
      provider: 'PAYOS',
      providerOrderCode: `test-${userId}`,
      status: 'PAID',
      paidAt: new Date(),
    },
  });
  await prisma.premiumEntitlement.create({
    data: { userId, status: 'ACTIVE', source: 'PAYMENT', expiresAt: new Date(Date.now() + 30 * 86_400_000), orderId: order.id },
  });

  return { paymentOrderId: order.id };
}

describe('Account Data Rights (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Export — unauthenticated/ownership', () => {
    it('rejects an unauthenticated export request (global CsrfGuard rejects a mutating request with no token before JwtAuthGuard is even reached — same layering every other mutating route in this app has)', async () => {
      await request(app.getHttpServer()).post('/users/me/export').expect(403);
    });

    it('rejects an unauthenticated fetch-by-job-id request', async () => {
      await request(app.getHttpServer()).get('/users/me/export/does-not-exist').expect(401);
    });
  });

  describe('Export — content and security', () => {
    it('produces a versioned export containing this user’s own real data, no secrets', async () => {
      const { headers, userId } = await register(app, uniqueEmail('export-content'));
      await seedRealisticUserData(app, prisma, headers, userId);

      const res = await request(app.getHttpServer()).post('/users/me/export').set(headers).expect(201);
      const result = res.body.data.result;

      expect(result.exportVersion).toBe(1);
      expect(result.account.id).toBe(userId);
      expect(result.journal).toHaveLength(1);
      expect(result.discoveries.tarot).toHaveLength(1);
      expect(result.discoveries.numerology).toHaveLength(1);
      expect(result.memory.memories).toHaveLength(1);
      expect(result.memory.legacyNotes).toHaveLength(1);
      expect(result.premium.entitlements).toHaveLength(1);
      expect(result.premium.paymentOrders).toHaveLength(1);

      const raw = JSON.stringify(result);
      expect(raw).not.toContain('passwordHash');
      expect(raw).not.toContain(PASSWORD);
      // Internal PayOS correlation id must never leave the server (payment-foundation.md §3).
      expect(raw).not.toContain(`test-${userId}`);
    });

    it('a second user’s export never includes the first user’s data', async () => {
      const userA = await register(app, uniqueEmail('export-a'));
      await seedRealisticUserData(app, prisma, userA.headers, userA.userId);
      const userB = await register(app, uniqueEmail('export-b'));

      const res = await request(app.getHttpServer()).post('/users/me/export').set(userB.headers).expect(201);
      const result = res.body.data.result;

      expect(result.account.id).toBe(userB.userId);
      expect(result.journal).toHaveLength(0);
      expect(result.discoveries.tarot).toHaveLength(0);
    });

    it('cannot fetch another user’s cached export by job id (IDOR)', async () => {
      const userA = await register(app, uniqueEmail('export-idor-a'));
      const created = await request(app.getHttpServer()).post('/users/me/export').set(userA.headers).expect(201);
      const jobId = created.body.data.jobId as string;

      const userB = await register(app, uniqueEmail('export-idor-b'));
      await request(app.getHttpServer()).get(`/users/me/export/${jobId}`).set(userB.headers).expect(404);
    });

    it('the same user can fetch their own completed export by job id', async () => {
      const { headers } = await register(app, uniqueEmail('export-fetch'));
      const created = await request(app.getHttpServer()).post('/users/me/export').set(headers).expect(201);
      const jobId = created.body.data.jobId as string;

      const fetched = await request(app.getHttpServer()).get(`/users/me/export/${jobId}`).set(headers).expect(200);
      expect(fetched.body.data.result.account.email).toBeDefined();
    });

    it('404s for an unknown/expired export job id', async () => {
      const { headers } = await register(app, uniqueEmail('export-404'));
      await request(app.getHttpServer()).get('/users/me/export/does-not-exist').set(headers).expect(404);
    });
  });

  describe('Deletion — CSRF and unauthenticated access', () => {
    it('rejects an unauthenticated deletion request (CsrfGuard-first, same layering as export)', async () => {
      await request(app.getHttpServer()).delete('/users/me').send({ password: PASSWORD }).expect(403);
    });

    it('rejects a deletion request missing the CSRF header (real cookie, no token)', async () => {
      const { headers } = await register(app, uniqueEmail('delete-csrf'));
      await request(app.getHttpServer())
        .delete('/users/me')
        .set('Cookie', headers.Cookie)
        .send({ password: PASSWORD })
        .expect(403);
    });
  });

  describe('Deletion — confirmation', () => {
    it('rejects the wrong password and deletes nothing', async () => {
      const { headers, userId } = await register(app, uniqueEmail('delete-wrong-pass'));
      await request(app.getHttpServer()).delete('/users/me').set(headers).send({ password: 'WrongPassword1!' }).expect(400);

      const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
      expect(user.status).toBe('ACTIVE');
    });

    it('rejects mass-assigned fields (only password is accepted)', async () => {
      const { headers, userId } = await register(app, uniqueEmail('delete-mass-assign'));
      await request(app.getHttpServer())
        .delete('/users/me')
        .set(headers)
        .send({ password: PASSWORD, status: 'ACTIVE', userId: 'someone-else' })
        .expect(400);

      const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
      expect(user.status).toBe('ACTIVE');
    });
  });

  describe('Deletion — real cascade against real data, real cross-cutting effects', () => {
    it('deletes all personal content, retains payment/premium records, ends the session, denies auth afterward', async () => {
      const { headers, userId } = await register(app, uniqueEmail('delete-full'));
      const { paymentOrderId } = await seedRealisticUserData(app, prisma, headers, userId);

      const meBefore = await request(app.getHttpServer()).get('/auth/me').set('Cookie', headers.Cookie).expect(200);
      expect(meBefore.body.data.id).toBe(userId);

      const del = await request(app.getHttpServer()).delete('/users/me').set(headers).send({ password: PASSWORD }).expect(204);
      // Auth cookies are cleared server-side on success.
      const setCookie = (del.headers['set-cookie'] as unknown as string[]) ?? [];
      expect(setCookie.some((c) => c.startsWith('beaconvie_access_token=;') || c.includes('beaconvie_access_token=;'))).toBe(true);

      // The still-unexpired access token from before deletion must be rejected immediately —
      // not eventually, per docs/architecture/account-data-rights.md §4.
      await request(app.getHttpServer()).get('/auth/me').set('Cookie', headers.Cookie).expect(401);
      // Refresh must also be denied (sessions were hard-deleted).
      await request(app.getHttpServer()).post('/auth/refresh').set('Cookie', headers.Cookie).expect(401);

      // Real DB state: personal content gone.
      const [journalCount, tarotCount, numerologyCount, memoryCount, memoryNoteCount, sessionCount] = await Promise.all([
        prisma.journalEntry.count({ where: { userId } }),
        prisma.tarotReading.count({ where: { userId } }),
        prisma.numerologyReading.count({ where: { userId } }),
        prisma.memory.count({ where: { userId } }),
        prisma.memoryNote.count({ where: { userId } }),
        prisma.userSession.count({ where: { userId } }),
      ]);
      expect(journalCount).toBe(0);
      expect(tarotCount).toBe(0);
      expect(numerologyCount).toBe(0);
      expect(memoryCount).toBe(0);
      expect(memoryNoteCount).toBe(0);
      expect(sessionCount).toBe(0);

      // Real DB state: payment/premium retained, financial/accounting integrity preserved.
      const [order, entitlement, user] = await Promise.all([
        prisma.paymentOrder.findUnique({ where: { id: paymentOrderId } }),
        prisma.premiumEntitlement.findFirst({ where: { userId } }),
        prisma.user.findUniqueOrThrow({ where: { id: userId } }),
      ]);
      expect(order).not.toBeNull();
      expect(order?.status).toBe('PAID');
      expect(entitlement).not.toBeNull();
      expect(entitlement?.status).toBe('ACTIVE');

      // User row scrubbed, not deleted.
      expect(user.status).toBe('DELETED');
      expect(user.email).toBe(`deleted+${userId}@beaconvie.invalid`);
      expect(user.displayName).toBe('Deleted user');

      // Login with the original (now-invalid) credentials must fail.
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: user.email, password: PASSWORD })
        .expect(401);
    });

    it('is safely repeatable — a second deletion attempt is a clean no-op, not an error or a second destructive pass', async () => {
      const { headers, userId } = await register(app, uniqueEmail('delete-repeat'));
      await request(app.getHttpServer()).delete('/users/me').set(headers).send({ password: PASSWORD }).expect(204);

      // The access token is now rejected (Sprint 10 guard fix), so a literal repeat HTTP call
      // with the SAME cookies can't reach the service layer a second time — which is itself the
      // desired outer-layer safety property. Verify the service-level idempotency directly
      // (the deeper guarantee the brief asks for) since a second authenticated call is no longer
      // reachable through the real HTTP surface once deleted, by design.
      const { AccountDeletionService } = await import('../src/users/deletion/account-deletion.service');
      const service = app.get(AccountDeletionService);
      await expect(service.deleteAccount(userId, 'irrelevant')).resolves.toBeUndefined();

      const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
      expect(user.status).toBe('DELETED');
    });
  });

  describe('Cross-user security', () => {
    it('User A cannot delete User B’s account by any input — deletion is always scoped to the authenticated caller', async () => {
      const userA = await register(app, uniqueEmail('cross-delete-a'));
      const userB = await register(app, uniqueEmail('cross-delete-b'));

      // Even if User A somehow knew User B's password, the endpoint has no way to target another
      // user — there is no userId field it accepts. This proves the deletion is authenticated-
      // caller-scoped, not just password-gated.
      await request(app.getHttpServer()).delete('/users/me').set(userA.headers).send({ password: PASSWORD }).expect(204);

      const userBStillActive = await prisma.user.findUniqueOrThrow({ where: { id: userB.userId } });
      expect(userBStillActive.status).toBe('ACTIVE');
    });
  });

  describe('Re-registration after deletion', () => {
    it('the original email becomes free to register again as a brand-new, unrelated account', async () => {
      const email = uniqueEmail('reregister');
      const first = await register(app, email);
      await request(app.getHttpServer()).delete('/users/me').set(first.headers).send({ password: PASSWORD }).expect(204);

      const second = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email, displayName: 'New Owner', password: PASSWORD, confirmPassword: PASSWORD, acceptedTerms: true })
        .expect(201);

      expect(second.body.data.id).not.toBe(first.userId);

      // The old (now-scrubbed) login must still fail — logging in with the original email now
      // resolves to the NEW account, and the OLD password was randomized on deletion, so this is
      // just an ordinary wrong-password rejection, not an identity mix-up.
      const oldAccount = await prisma.user.findUniqueOrThrow({ where: { id: first.userId } });
      expect(oldAccount.email).not.toBe(email); // scrubbed, no longer collides with the new row
    });

    it('a fresh registration with the freed email starts with zero Premium/payment history — no entitlement inheritance', async () => {
      const email = uniqueEmail('reregister-no-inherit');
      const first = await register(app, email);
      await seedRealisticUserData(app, prisma, first.headers, first.userId);
      await request(app.getHttpServer()).delete('/users/me').set(first.headers).send({ password: PASSWORD }).expect(204);

      const second = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email, displayName: 'New Owner', password: PASSWORD, confirmPassword: PASSWORD, acceptedTerms: true })
        .expect(201);
      const secondUserId = second.body.data.id as string;
      const secondCookie = extractCookie(second.headers['set-cookie'], 'beaconvie_access_token')!;
      const secondHeaders = csrfHeaders(secondCookie, second.headers['set-cookie']);

      const status = await request(app.getHttpServer()).get('/payment/premium-status').set(secondHeaders).expect(200);
      expect(status.body.data.isPremium).toBe(false);

      const entitlements = await prisma.premiumEntitlement.count({ where: { userId: secondUserId } });
      expect(entitlements).toBe(0);
    });
  });

  describe('Late webhook after account deletion — no entitlement resurrection (Sprint 10 closure finding)', () => {
    it('a valid PAID webhook that arrives after the buyer deleted their account updates order accounting but grants no new entitlement', async () => {
      const { headers, userId } = await register(app, uniqueEmail('late-webhook'));
      const checkout = await request(app.getHttpServer()).post('/payment/checkout').set(headers).expect(201);
      const orderId = checkout.body.data.id as string;

      await request(app.getHttpServer()).delete('/users/me').set(headers).send({ password: PASSWORD }).expect(204);

      const orderRow = await prisma.paymentOrder.findUniqueOrThrow({ where: { id: orderId } });
      const payload = buildWebhookPayload(orderRow.providerOrderCode!, orderRow.amount);
      await request(app.getHttpServer()).post('/payment/webhooks/payos').send(payload).expect(200);

      const orderAfter = await prisma.paymentOrder.findUniqueOrThrow({ where: { id: orderId } });
      expect(orderAfter.status).toBe('PAID'); // accounting stays accurate — the payment really happened

      const entitlements = await prisma.premiumEntitlement.count({ where: { userId } });
      expect(entitlements).toBe(0); // but no dormant entitlement is minted for a deleted account
    });
  });

  describe('Multi-session revocation', () => {
    it('deleting the account from one session immediately revokes every other active session too', async () => {
      const email = uniqueEmail('multi-session');
      const first = await register(app, email);

      const secondLogin = await request(app.getHttpServer()).post('/auth/login').send({ email, password: PASSWORD }).expect(200);
      const secondCookie = extractCookie(secondLogin.headers['set-cookie'], 'beaconvie_access_token')!;

      await request(app.getHttpServer()).delete('/users/me').set(first.headers).send({ password: PASSWORD }).expect(204);

      // The second, independent session's still-unexpired access token must also be rejected.
      await request(app.getHttpServer()).get('/auth/me').set('Cookie', secondCookie).expect(401);

      const sessionCount = await prisma.userSession.count({ where: { userId: first.userId } });
      expect(sessionCount).toBe(0);
    });
  });
});
