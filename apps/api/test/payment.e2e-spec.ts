import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, csrfHeaders, extractCookie } from './utils/test-app';
import { PrismaService } from '../src/prisma/prisma.service';
import { signPayOSData } from '../src/payment/providers/payos-signature.util';

// Sprint 7 — Premium & Payment Foundation e2e coverage against the real HTTP surface, the real
// Prisma-backed state machine, and the real PayOS webhook signature scheme (signed here with the
// same PAYOS_CHECKSUM_KEY .env.test configures — see docs/architecture/payment-foundation.md
// "Webhook verification" for what this proves vs. what remains UNVERIFIED without live PayOS
// sandbox credentials). PAYOS_MOCK_CHECKOUT=true in .env.test means checkout creation never makes a
// real network call, but the checkout order itself, its price, and every webhook state transition
// below are all real.

function uniqueEmail(label: string): string {
  return `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

async function registerAndGetHeaders(app: INestApplication, email: string): Promise<Record<string, string>> {
  const password = 'Sup3r$ecretPass';
  const res = await request(app.getHttpServer())
    .post('/auth/register')
    .send({ email, displayName: 'Payment User', password, confirmPassword: password, acceptedTerms: true })
    .expect(201);
  const accessCookie = extractCookie(res.headers['set-cookie'], 'beaconvie_access_token')!;
  return csrfHeaders(accessCookie, res.headers['set-cookie']);
}

interface PaymentOrderApi {
  id: string;
  status: string;
  product: string;
  amount: number;
  currency: string;
  checkoutUrl: string | null;
}

interface PremiumStatusApi {
  isPremium: boolean;
  status: string;
  expiresAt: string | null;
  priceVnd: number;
  currency: string;
  isMvpTestPrice: boolean;
  paymentsEnabled: boolean;
}

function buildWebhookPayload(
  orderCode: string,
  amount: number,
  options: { success?: boolean; code?: string; currency?: string; reference?: string; description?: string } = {},
) {
  const data = {
    orderCode: Number(orderCode),
    amount,
    description: options.description ?? 'BeaconVie Premium',
    reference: options.reference ?? `FT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    currency: options.currency ?? 'VND',
  };
  const signature = signPayOSData(data, process.env.PAYOS_CHECKSUM_KEY!);
  return { code: options.code ?? '00', desc: 'success', success: options.success ?? true, data, signature };
}

describe('Payment & Premium (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  async function providerOrderCodeFor(orderId: string): Promise<string> {
    const order = await prisma.paymentOrder.findUniqueOrThrow({ where: { id: orderId } });
    return order.providerOrderCode;
  }

  describe('Checkout (Phase 5)', () => {
    it('an authenticated user can create a checkout order, priced entirely by the backend', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('checkout'));
      const res = await request(app.getHttpServer()).post('/payment/checkout').set(headers).expect(201);
      const order = res.body.data as PaymentOrderApi;

      expect(order.status).toBe('PENDING');
      expect(order.product).toBe('PREMIUM_30D');
      expect(order.currency).toBe('VND');
      expect(order.amount).toBeGreaterThan(0);
      expect(order.checkoutUrl).toBeTruthy();
    });

    it('rejects an unauthenticated checkout attempt', async () => {
      // CsrfGuard is a global guard and runs before any route's own JwtAuthGuard, so a truly
      // cookie-less request 403s on the missing CSRF token before authentication is even checked —
      // real, correct behavior (see csrf.guard.ts), just not what isolates the 401 case. To reach
      // JwtAuthGuard specifically, present a valid CSRF pair (from the public csrf-token endpoint)
      // but no access-token cookie.
      const csrf = await request(app.getHttpServer()).get('/auth/csrf-token').expect(200);
      const csrfCookie = extractCookie(csrf.headers['set-cookie'], 'beaconvie_csrf_token')!;
      await request(app.getHttpServer())
        .post('/payment/checkout')
        .set('Cookie', csrfCookie)
        .set('X-CSRF-Token', csrf.body.data.csrfToken)
        .expect(401);
    });

    it('rejects a checkout request missing its CSRF token', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('csrf'));
      const res = await request(app.getHttpServer()).post('/payment/checkout').set('Cookie', headers.Cookie).expect(403);
      expect(res.body.error.code).toBe('CSRF_TOKEN_MISSING');
    });

    it('a client cannot influence the price — no body field is accepted or honored', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('price-forge'));
      const res = await request(app.getHttpServer())
        .post('/payment/checkout')
        .set(headers)
        .send({ amount: 1, currency: 'USD', product: 'ENTERPRISE' })
        .expect(201);
      const order = res.body.data as PaymentOrderApi;
      expect(order.currency).toBe('VND');
      expect(order.amount).not.toBe(1);
    });
  });

  describe('Order ownership (Phase 14 — cross-user isolation)', () => {
    it('404s for another user requesting someone else’s order, identically to a nonexistent id', async () => {
      const ownerHeaders = await registerAndGetHeaders(app, uniqueEmail('order-owner'));
      const otherHeaders = await registerAndGetHeaders(app, uniqueEmail('order-other'));
      const created = await request(app.getHttpServer()).post('/payment/checkout').set(ownerHeaders).expect(201);
      const orderId = (created.body.data as PaymentOrderApi).id;

      const forReal = await request(app.getHttpServer()).get(`/payment/orders/${orderId}`).set(otherHeaders).expect(404);
      const forFake = await request(app.getHttpServer()).get('/payment/orders/does-not-exist').set(otherHeaders).expect(404);
      expect(forReal.body.error.code).toBe(forFake.body.error.code);
      expect(forReal.body.error.code).toBe('PAYMENT_ORDER_NOT_FOUND');
    });
  });

  describe('Premium status before any purchase', () => {
    it('a fresh user is Free with no entitlement', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('fresh'));
      const res = await request(app.getHttpServer()).get('/payment/premium-status').set(headers).expect(200);
      const status = res.body.data as PremiumStatusApi;
      expect(status).toEqual({
        isPremium: false,
        status: 'NONE',
        expiresAt: null,
        priceVnd: 79000,
        currency: 'VND',
        isMvpTestPrice: true,
        paymentsEnabled: true,
      });
    });
  });

  describe('Webhook security (Phase 6 — CRITICAL)', () => {
    it('rejects a webhook with an invalid signature and never grants Premium from it', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('bad-sig'));
      const created = await request(app.getHttpServer()).post('/payment/checkout').set(headers).expect(201);
      const order = created.body.data as PaymentOrderApi;
      const orderCode = await providerOrderCodeFor(order.id);

      const payload = buildWebhookPayload(orderCode, order.amount);
      payload.signature = 'deadbeef'.repeat(8); // clearly wrong, but valid hex length

      await request(app.getHttpServer()).post('/payment/webhooks/payos').send(payload).expect(400);

      const statusRes = await request(app.getHttpServer()).get('/payment/premium-status').set(headers).expect(200);
      expect((statusRes.body.data as PremiumStatusApi).isPremium).toBe(false);
      const orderRes = await request(app.getHttpServer()).get(`/payment/orders/${order.id}`).set(headers).expect(200);
      expect((orderRes.body.data as PaymentOrderApi).status).toBe('PENDING');
    });

    it('rejects a webhook for an order that does not exist', async () => {
      const payload = buildWebhookPayload('999999999999', 79000);
      await request(app.getHttpServer()).post('/payment/webhooks/payos').send(payload).expect(400);
    });

    it('rejects a webhook whose amount does not match the order', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('bad-amount'));
      const created = await request(app.getHttpServer()).post('/payment/checkout').set(headers).expect(201);
      const order = created.body.data as PaymentOrderApi;
      const orderCode = await providerOrderCodeFor(order.id);

      const payload = buildWebhookPayload(orderCode, 1); // real signature, wrong amount
      await request(app.getHttpServer()).post('/payment/webhooks/payos').send(payload).expect(400);

      const orderRes = await request(app.getHttpServer()).get(`/payment/orders/${order.id}`).set(headers).expect(200);
      expect((orderRes.body.data as PaymentOrderApi).status).toBe('PENDING');
    });

    it('a valid, correctly-signed webhook grants Premium exactly once even if delivered twice', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('happy-path'));
      const created = await request(app.getHttpServer()).post('/payment/checkout').set(headers).expect(201);
      const order = created.body.data as PaymentOrderApi;
      const orderCode = await providerOrderCodeFor(order.id);
      const payload = buildWebhookPayload(orderCode, order.amount);

      await request(app.getHttpServer()).post('/payment/webhooks/payos').send(payload).expect(200);
      await request(app.getHttpServer()).post('/payment/webhooks/payos').send(payload).expect(200); // exact duplicate, safe no-op

      const orderRes = await request(app.getHttpServer()).get(`/payment/orders/${order.id}`).set(headers).expect(200);
      expect((orderRes.body.data as PaymentOrderApi).status).toBe('PAID');

      const statusRes = await request(app.getHttpServer()).get('/payment/premium-status').set(headers).expect(200);
      const status = statusRes.body.data as PremiumStatusApi;
      expect(status.isPremium).toBe(true);
      expect(status.status).toBe('ACTIVE');
      expect(new Date(status.expiresAt!).getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('Webhook concurrency (Release Closure re-audit — true concurrent delivery, not just sequential)', () => {
    it('two byte-for-byte identical webhook requests fired truly concurrently (Promise.all) still grant Premium exactly once', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('concurrent-identical'));
      const created = await request(app.getHttpServer()).post('/payment/checkout').set(headers).expect(201);
      const order = created.body.data as PaymentOrderApi;
      const orderCode = await providerOrderCodeFor(order.id);
      const payload = buildWebhookPayload(orderCode, order.amount);

      // Both requests race against the same DB row for real — no sequential `await` between them.
      const results = await Promise.all([
        request(app.getHttpServer()).post('/payment/webhooks/payos').send(payload),
        request(app.getHttpServer()).post('/payment/webhooks/payos').send(payload),
      ]);
      expect(results.every((r) => r.status === 200)).toBe(true); // one processes, one is a safe duplicate no-op — neither errors

      const orderRes = await request(app.getHttpServer()).get(`/payment/orders/${order.id}`).set(headers).expect(200);
      expect((orderRes.body.data as PaymentOrderApi).status).toBe('PAID');

      const entitlementCount = await prisma.premiumEntitlement.count({ where: { userId: (await prisma.paymentOrder.findUniqueOrThrow({ where: { id: order.id } })).userId } });
      expect(entitlementCount).toBe(1);
    });

    it('two concurrent deliveries with different bank references for the same order (a provider retry) still grant Premium exactly once', async () => {
      const headers = await registerAndGetHeaders(app, uniqueEmail('concurrent-distinct-ref'));
      const created = await request(app.getHttpServer()).post('/payment/checkout').set(headers).expect(201);
      const order = created.body.data as PaymentOrderApi;
      const orderCode = await providerOrderCodeFor(order.id);
      // Two distinct externalEventIds (different `reference`) for the SAME order — this is what
      // proves the second, independent safety layer (the conditional `status = 'PENDING'`
      // updateMany), not just the unique-constraint layer exercised by the identical-payload test
      // above.
      const payloadA = buildWebhookPayload(orderCode, order.amount, { reference: 'FT-CONCURRENT-A' });
      const payloadB = buildWebhookPayload(orderCode, order.amount, { reference: 'FT-CONCURRENT-B' });

      const results = await Promise.all([
        request(app.getHttpServer()).post('/payment/webhooks/payos').send(payloadA),
        request(app.getHttpServer()).post('/payment/webhooks/payos').send(payloadB),
      ]);
      expect(results.every((r) => r.status === 200)).toBe(true);

      const orderRes = await request(app.getHttpServer()).get(`/payment/orders/${order.id}`).set(headers).expect(200);
      expect((orderRes.body.data as PaymentOrderApi).status).toBe('PAID');

      const userId = (await prisma.paymentOrder.findUniqueOrThrow({ where: { id: order.id } })).userId;
      const entitlementCount = await prisma.premiumEntitlement.count({ where: { userId } });
      expect(entitlementCount).toBe(1); // exactly one grant despite two distinct, both-valid webhook events

      const events = await prisma.paymentWebhookEvent.findMany({ where: { orderId: order.id } });
      expect(events).toHaveLength(2); // both events are individually recorded (distinct externalEventId)
      expect(events.filter((e) => e.status === 'PROCESSED')).toHaveLength(2); // both marked processed — only one actually changed the order/granted
    });
  });

  describe('Premium Tarot access after payment (Phase 8/9)', () => {
    it('a Free user is denied a 4th Single Card draw the same day; a verified-Premium user is allowed it', async () => {
      // Free user hits the 3/day ceiling.
      const freeHeaders = await registerAndGetHeaders(app, uniqueEmail('free-tarot'));
      for (let i = 0; i < 3; i++) {
        await request(app.getHttpServer()).post('/tarot/draw').set(freeHeaders).send({ type: 'SINGLE_CARD' }).expect(201);
      }
      const denied = await request(app.getHttpServer()).post('/tarot/draw').set(freeHeaders).send({ type: 'SINGLE_CARD' }).expect(403);
      expect(denied.body.error.code).toBe('PREMIUM_REQUIRED');

      // A different user, now genuinely verified-Premium via a real webhook, is allowed past 3.
      const premiumHeaders = await registerAndGetHeaders(app, uniqueEmail('premium-tarot'));
      const order = (await request(app.getHttpServer()).post('/payment/checkout').set(premiumHeaders).expect(201)).body.data as PaymentOrderApi;
      const orderCode = await providerOrderCodeFor(order.id);
      await request(app.getHttpServer())
        .post('/payment/webhooks/payos')
        .send(buildWebhookPayload(orderCode, order.amount))
        .expect(200);

      for (let i = 0; i < 4; i++) {
        await request(app.getHttpServer()).post('/tarot/draw').set(premiumHeaders).send({ type: 'SINGLE_CARD' }).expect(201);
      }
    });
  });
});
