import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, csrfHeaders, extractCookie } from './utils/test-app';
import { PrismaService } from '../src/prisma/prisma.service';

// Interim Sprint — Admin Operator Tooling e2e coverage against the real HTTP surface, real
// Postgres, real Redis. There is no promotion endpoint by design (see
// docs/audit/admin-operator-tooling-pre-implementation-audit.md §13) — tests promote a user to
// ADMIN the same way a real operator would: a direct DB write, simulating the manual production
// promotion step, never an API call.

const PASSWORD = 'Sup3r$ecretPass';

function uniqueEmail(label: string): string {
  return `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

async function register(app: INestApplication, email: string): Promise<{ headers: Record<string, string>; userId: string }> {
  const res = await request(app.getHttpServer())
    .post('/auth/register')
    .send({ email, displayName: 'Admin Test User', password: PASSWORD, confirmPassword: PASSWORD, acceptedTerms: true })
    .expect(201);
  const accessCookie = extractCookie(res.headers['set-cookie'], 'beaconvie_access_token')!;
  const headers = csrfHeaders(accessCookie, res.headers['set-cookie']);
  return { headers, userId: res.body.data.id as string };
}

describe('Admin Operator Tooling (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  async function registerAdmin(label: string): Promise<{ headers: Record<string, string>; userId: string }> {
    const identity = await register(app, uniqueEmail(label));
    await prisma.user.update({ where: { id: identity.userId }, data: { role: 'ADMIN' } });
    return identity;
  }

  describe('Authorization — the actual hard security gate', () => {
    it('anonymous → 401', async () => {
      await request(app.getHttpServer()).get('/admin/notifications/health').expect(401);
    });

    it('authenticated USER → 403 (never 401 — the session is real, the role is not)', async () => {
      const { headers } = await register(app, uniqueEmail('plain-user'));
      const res = await request(app.getHttpServer()).get('/admin/notifications/health').set(headers).expect(403);
      expect(res.body.error.code).toBe('ADMIN_REQUIRED');
    });

    it('authenticated ADMIN → 200', async () => {
      const { headers } = await registerAdmin('admin-happy');
      await request(app.getHttpServer()).get('/admin/notifications/health').set(headers).expect(200);
    });

    it('ADMIN demoted to USER in the DB, same still-valid JWT reused → 403 on the VERY NEXT request', async () => {
      const { headers, userId } = await registerAdmin('admin-demoted');
      await request(app.getHttpServer()).get('/admin/notifications/health').set(headers).expect(200);

      await prisma.user.update({ where: { id: userId }, data: { role: 'USER' } });

      const res = await request(app.getHttpServer()).get('/admin/notifications/health').set(headers).expect(403);
      expect(res.body.error.code).toBe('ADMIN_REQUIRED');
    });

    it('a re-promoted ADMIN with the same still-valid JWT is allowed again on the very next request (proves the check is live both directions, not a one-way cache)', async () => {
      const { headers, userId } = await registerAdmin('admin-repromoted');
      await prisma.user.update({ where: { id: userId }, data: { role: 'USER' } });
      await request(app.getHttpServer()).get('/admin/notifications/health').set(headers).expect(403);

      await prisma.user.update({ where: { id: userId }, data: { role: 'ADMIN' } });
      await request(app.getHttpServer()).get('/admin/notifications/health').set(headers).expect(200);
    });
  });

  describe('Mass-assignment — a normal user must never be able to self-promote', () => {
    it('a role field on /auth/register is rejected outright, and the created user is a plain USER', async () => {
      const email = uniqueEmail('register-mass-assign');
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email, displayName: 'X', password: PASSWORD, confirmPassword: PASSWORD, acceptedTerms: true, role: 'ADMIN' })
        .expect(400);
      expect(res.body.error).toBeDefined();

      const user = await prisma.user.findUnique({ where: { email } });
      expect(user).toBeNull(); // registration itself was rejected — no half-created row
    });

    it('a role field on the preferences update endpoint is rejected outright', async () => {
      const { headers, userId } = await register(app, uniqueEmail('preferences-mass-assign'));
      await request(app.getHttpServer())
        .patch('/users/me/preferences')
        .set(headers)
        .send({ memoryPreference: 'ASK_BEFORE_SAVING', role: 'ADMIN' })
        .expect(400);

      const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
      expect(user.role).toBe('USER');
    });

    it('a role field on the account-deletion endpoint is rejected outright (mirrors the existing status/userId mass-assignment precedent)', async () => {
      const { headers, userId } = await register(app, uniqueEmail('deletion-mass-assign'));
      await request(app.getHttpServer()).delete('/users/me').set(headers).send({ password: PASSWORD, role: 'ADMIN' }).expect(400);

      const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
      expect(user.status).toBe('ACTIVE');
      expect(user.role).toBe('USER');
    });
  });

  describe('User lookup', () => {
    it('exact-match by id finds the real user with only ALLOW-listed fields, never passwordHash', async () => {
      const admin = await registerAdmin('lookup-admin');
      const target = await register(app, uniqueEmail('lookup-target'));

      const found = await request(app.getHttpServer()).get('/admin/users/lookup').set(admin.headers).query({ id: target.userId }).expect(200);
      expect(found.body.data.id).toBe(target.userId);
      expect(found.body.data.role).toBe('USER');
      expect(JSON.stringify(found.body.data)).not.toContain('passwordHash');
      expect(found.body.data).not.toHaveProperty('passwordHash');
    });

    it('exact-match by email finds the same user', async () => {
      const admin = await registerAdmin('lookup-admin-email');
      const email = uniqueEmail('lookup-target-email');
      const target = await register(app, email);

      const found = await request(app.getHttpServer()).get('/admin/users/lookup').set(admin.headers).query({ email }).expect(200);
      expect(found.body.data.id).toBe(target.userId);
    });

    it('rejects a lookup with both email and id supplied at once', async () => {
      const admin = await registerAdmin('lookup-both-keys');
      await request(app.getHttpServer()).get('/admin/users/lookup').set(admin.headers).query({ email: 'a@x.com', id: 'user-1' }).expect(400);
    });

    it('returns 404 for a well-formed but nonexistent id', async () => {
      const admin = await registerAdmin('lookup-404');
      await request(app.getHttpServer()).get('/admin/users/lookup').set(admin.headers).query({ id: 'does-not-exist' }).expect(404);
    });

    it('rejects a lookup with neither email nor id', async () => {
      const admin = await registerAdmin('lookup-no-key');
      await request(app.getHttpServer()).get('/admin/users/lookup').set(admin.headers).expect(400);
    });

    it('a deleted account shows the real scrubbed state, not an error and not stale PII', async () => {
      const admin = await registerAdmin('lookup-deleted-admin');
      const target = await register(app, uniqueEmail('lookup-deleted-target'));

      await request(app.getHttpServer()).delete('/users/me').set(target.headers).send({ password: PASSWORD }).expect(204);

      const res = await request(app.getHttpServer()).get('/admin/users/lookup').set(admin.headers).query({ id: target.userId }).expect(200);
      expect(res.body.data.status).toBe('DELETED');
      expect(res.body.data.email).toContain('@beaconvie.invalid'); // the real scrubbed email, not the original
      expect(res.body.data.email).not.toContain('lookup-deleted-target');
    });
  });

  describe('Entitlement lookup — read-only, no grant/revoke endpoint exists', () => {
    it('returns the real entitlement history for a paying user', async () => {
      const admin = await registerAdmin('entitlement-admin');
      const target = await register(app, uniqueEmail('entitlement-target'));

      const order = await prisma.paymentOrder.create({
        data: { userId: target.userId, product: 'PREMIUM_30D', amount: 79000, currency: 'VND', provider: 'PAYOS', providerOrderCode: `admin-e2e-${target.userId}`, status: 'PAID', paidAt: new Date() },
      });
      await prisma.premiumEntitlement.create({
        data: { userId: target.userId, status: 'ACTIVE', source: 'PAYMENT', expiresAt: new Date(Date.now() + 30 * 86_400_000), orderId: order.id },
      });

      const res = await request(app.getHttpServer()).get(`/admin/users/${target.userId}/entitlement`).set(admin.headers).expect(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].status).toBe('ACTIVE');
      expect(res.body.data[0].orderId).toBe(order.id);
    });

    it('returns 404 for a nonexistent user id', async () => {
      const admin = await registerAdmin('entitlement-404');
      await request(app.getHttpServer()).get('/admin/users/does-not-exist/entitlement').set(admin.headers).expect(404);
    });
  });

  describe('Payment lookup — safe fields only', () => {
    it('never returns providerPaymentLinkId, providerCheckoutUrl, or raw metadata, even though they exist on the row', async () => {
      const admin = await registerAdmin('payment-admin');
      const target = await register(app, uniqueEmail('payment-target'));

      await prisma.paymentOrder.create({
        data: {
          userId: target.userId,
          product: 'PREMIUM_30D',
          amount: 79000,
          currency: 'VND',
          provider: 'PAYOS',
          providerOrderCode: `admin-e2e-payment-${target.userId}`,
          providerPaymentLinkId: 'sentinel-link-id-must-not-leak',
          providerCheckoutUrl: 'https://pay.example.invalid/sentinel-checkout-url-must-not-leak',
          status: 'PENDING',
          metadata: { internalNote: 'sentinel-metadata-must-not-leak' },
        },
      });

      const res = await request(app.getHttpServer()).get(`/admin/users/${target.userId}/payments`).set(admin.headers).expect(200);
      expect(res.body.data).toHaveLength(1);
      const serialized = JSON.stringify(res.body.data);
      expect(serialized).not.toContain('sentinel-link-id-must-not-leak');
      expect(serialized).not.toContain('sentinel-checkout-url-must-not-leak');
      expect(serialized).not.toContain('sentinel-metadata-must-not-leak');
    });

    it('direct order lookup by orderId works and 404s for an unknown order', async () => {
      const admin = await registerAdmin('payment-direct-admin');
      const target = await register(app, uniqueEmail('payment-direct-target'));
      const order = await prisma.paymentOrder.create({
        data: { userId: target.userId, product: 'PREMIUM_30D', amount: 79000, currency: 'VND', provider: 'PAYOS', providerOrderCode: `admin-e2e-direct-${target.userId}`, status: 'PENDING' },
      });

      const res = await request(app.getHttpServer()).get(`/admin/payments/${order.id}`).set(admin.headers).expect(200);
      expect(res.body.data.id).toBe(order.id);

      await request(app.getHttpServer()).get('/admin/payments/does-not-exist').set(admin.headers).expect(404);
    });
  });

  describe('Notification health — real aggregates, no scheduler-run fabrication', () => {
    it('explicitly reports scheduler-run telemetry as not collected, never a fabricated value', async () => {
      const admin = await registerAdmin('notif-health-admin');
      const res = await request(app.getHttpServer()).get('/admin/notifications/health').set(admin.headers).expect(200);
      expect(res.body.data.schedulerRunTelemetry).toBe('NOT_COLLECTED');
      expect(Array.isArray(res.body.data.last24h)).toBe(true);
      expect(Array.isArray(res.body.data.last7d)).toBe(true);
    });
  });

  describe('AI spend — never content, correct failure-count null-ing', () => {
    it('aggregates real AIUsage rows and never exposes prompt/completion content (structurally absent from the response shape)', async () => {
      const admin = await registerAdmin('ai-spend-admin');
      const target = await register(app, uniqueEmail('ai-spend-target'));

      await prisma.aIUsage.create({
        data: {
          userId: target.userId,
          feature: 'EASTERN_HOROSCOPE',
          provider: 'GEMINI',
          model: 'gemini-3.5-flash-lite',
          promptTokens: 400,
          completionTokens: 150,
          totalTokens: 550,
          estimatedCostUsd: '0.000500',
        },
      });

      const res = await request(app.getHttpServer()).get('/admin/ai-spend').set(admin.headers).query({ window: '7d', userId: target.userId }).expect(200);
      expect(res.body.data.requestCount).toBeGreaterThanOrEqual(1);
      expect(res.body.data.estimatedCostUsd).toBeGreaterThan(0);
      expect(res.body.data.failureCount).toBeNull(); // userId filter set — ProviderLog has no userId column
      expect(Object.keys(res.body.data).sort()).toEqual(['estimatedCostUsd', 'failureCount', 'filters', 'requestCount', 'window'].sort());
    });

    it('rejects an invalid window value', async () => {
      const admin = await registerAdmin('ai-spend-invalid-window');
      await request(app.getHttpServer()).get('/admin/ai-spend').set(admin.headers).query({ window: 'last-decade' }).expect(400);
    });
  });
});
