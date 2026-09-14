import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PayOSProvider } from '../providers/payos.provider';
import { signPayOSData } from '../providers/payos-signature.util';
import { EntitlementService } from '../entitlement/entitlement.service';
import { PaymentWebhookService } from './payment-webhook.service';
import { PaymentProviderSignatureError, type VerifiedWebhookPayment } from '../providers/payment-provider.interface';
import { dedupeKeyForPremiumActivated } from '../../notifications/eligibility/date-key.util';

jest.mock('@sentry/nestjs', () => ({ captureMessage: jest.fn() }));
import * as Sentry from '@sentry/nestjs';

const ORDER_ID = 'order-1';
const USER_ID = 'user-1';

function paidPayload(overrides: Partial<VerifiedWebhookPayment> = {}): VerifiedWebhookPayment {
  return { orderCode: 123456, amount: 79000, currency: 'VND', status: 'PAID', reference: 'FT2600001', description: 'BeaconVie Premium', ...overrides };
}

interface OrderRow {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  providerOrderCode: string;
  status: string;
  paidAt: Date | null;
  failedAt: Date | null;
}

function makeHarness(
  options: { verifyImpl?: (payload: unknown) => VerifiedWebhookPayment; order?: Partial<OrderRow>; userStatus?: string } = {},
) {
  const order: OrderRow = {
    id: ORDER_ID,
    userId: USER_ID,
    amount: 79000,
    currency: 'VND',
    providerOrderCode: '123456',
    status: 'PENDING',
    paidAt: null,
    failedAt: null,
    ...options.order,
  };

  const user = { findUnique: jest.fn(async () => ({ status: options.userStatus ?? 'ACTIVE' })) };
  const orders = new Map<string, OrderRow>([[order.id, order]]);
  const webhookEvents: { id: string; provider: string; externalEventId: string; orderId: string | null; status: string; errorCategory: string | null; processedAt: Date | null }[] = [];

  const paymentOrder = {
    findUnique: jest.fn(async ({ where }: { where: { providerOrderCode?: string; id?: string } }) => {
      if (where.providerOrderCode !== undefined) {
        return [...orders.values()].find((o) => o.providerOrderCode === where.providerOrderCode) ?? null;
      }
      return orders.get(where.id!) ?? null;
    }),
    updateMany: jest.fn(async ({ where, data }: { where: { id: string; status: string }; data: Partial<OrderRow> }) => {
      const target = orders.get(where.id);
      if (!target || target.status !== where.status) return { count: 0 };
      Object.assign(target, data);
      return { count: 1 };
    }),
  };

  const paymentWebhookEvent = {
    findUnique: jest.fn(async ({ where }: { where: { provider_externalEventId: { provider: string; externalEventId: string } } }) => {
      const key = where.provider_externalEventId;
      return webhookEvents.find((event) => event.provider === key.provider && event.externalEventId === key.externalEventId) ?? null;
    }),
    create: jest.fn(async ({ data }: { data: { provider: string; externalEventId: string; orderId: string | null; status: string; errorCategory?: string } }) => {
      const exists = webhookEvents.find((e) => e.provider === data.provider && e.externalEventId === data.externalEventId);
      if (exists) throw new Prisma.PrismaClientKnownRequestError('Duplicate event', { code: 'P2002', clientVersion: '5.22.0' });
      const event = { id: `evt-${webhookEvents.length + 1}`, processedAt: null, errorCategory: data.errorCategory ?? null, ...data };
      webhookEvents.push(event);
      return event;
    }),
    update: jest.fn(async ({ where, data }: { where: { id: string }; data: Partial<(typeof webhookEvents)[number]> }) => {
      const event = webhookEvents.find((e) => e.id === where.id)!;
      Object.assign(event, data);
      return event;
    }),
  };

  const prisma = {
    paymentOrder,
    paymentWebhookEvent,
    user,
    $transaction: undefined as unknown as jest.Mock<Promise<unknown>, [(tx: unknown) => Promise<unknown>]>,
  };
  prisma.$transaction = jest.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn(prisma));

  const verifyWebhook = jest.fn(options.verifyImpl ?? (() => paidPayload()));
  const providerRegistry = { has: jest.fn().mockReturnValue(true), get: jest.fn().mockReturnValue({ verifyWebhook }) };
  const entitlementService = { grantPremium: jest.fn().mockResolvedValue(undefined) };
  const configService = { get: jest.fn().mockReturnValue({ payment: { premium: { durationDays: 30 } } }) };
  const notificationsService = { create: jest.fn().mockResolvedValue({ notification: { id: 'notif-1' }, created: true }) };
  const analyticsService = { trackServerEvent: jest.fn().mockResolvedValue(undefined) };

  const service = new PaymentWebhookService(
    prisma as never,
    configService as never,
    providerRegistry as never,
    entitlementService as never,
    notificationsService as never,
    analyticsService as never,
  );
  return { service, prisma, orders, webhookEvents, verifyWebhook, entitlementService, notificationsService, user, analyticsService };
}

describe('PaymentWebhookService — recovery of unprocessed signed deliveries', () => {
  it('retries a failed transaction, grants one 30-day entitlement, then ignores the third delivery', async () => {
    const key = 'synthetic-regression-checksum-key';
    const provider = new PayOSProvider({ clientId: 'test', apiKey: 'test', checksumKey: key, baseUrl: 'https://example.invalid', mockCheckout: false });
    const data = { orderCode: 123456, amount: 79000, currency: 'VND', reference: 'FT2600001', description: 'BeaconVie Premium' };
    const payload = { code: '00', success: true, desc: 'success', data, signature: signPayOSData(data, key) };
    const { service, prisma, orders, webhookEvents, entitlementService } = makeHarness({ verifyImpl: (input) => provider.verifyWebhook(input) });
    // Model DB rollback after the conditional order update, before the grant. The
    // durable VERIFIED event is deliberately outside this transaction, as in production.
    prisma.user.findUnique.mockRejectedValueOnce(new Error('transient database failure'));
    const apply = prisma.$transaction.getMockImplementation()!;
    prisma.$transaction.mockImplementationOnce(async (fn) => {
      const before = { ...orders.get(ORDER_ID)! };
      try { return await apply(fn); } catch (error) { orders.set(ORDER_ID, before); throw error; }
    });
    await expect(service.handlePayOSWebhook(payload)).rejects.toThrow('transient database failure');
    expect(orders.get(ORDER_ID)!.status).toBe('PENDING');
    expect(webhookEvents[0]!.status).toBe('VERIFIED');
    expect(webhookEvents[0]!.processedAt).toBeNull();
    expect(entitlementService.grantPremium).not.toHaveBeenCalled();

    await service.handlePayOSWebhook(payload);
    expect(prisma.$transaction).toHaveBeenCalledTimes(2);
    expect(orders.get(ORDER_ID)!.status).toBe('PAID');
    expect(webhookEvents).toHaveLength(1);
    expect(webhookEvents[0]!.status).toBe('PROCESSED');
    expect(webhookEvents[0]!.processedAt).not.toBeNull();
    expect(entitlementService.grantPremium).toHaveBeenCalledTimes(1);
    expect(entitlementService.grantPremium).toHaveBeenCalledWith(prisma, USER_ID, ORDER_ID, 30);

    await service.handlePayOSWebhook(payload);
    expect(prisma.$transaction).toHaveBeenCalledTimes(2);
    expect(entitlementService.grantPremium).toHaveBeenCalledTimes(1);
    expect(orders.get(ORDER_ID)!.status).toBe('PAID');
  });

  it('propagates unexpected event insertion errors instead of acknowledging duplicates', async () => {
    const { service, prisma, entitlementService } = makeHarness();
    prisma.paymentWebhookEvent.create.mockRejectedValueOnce(new Error('database unavailable'));
    await expect(service.handlePayOSWebhook({})).rejects.toThrow('database unavailable');
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(entitlementService.grantPremium).not.toHaveBeenCalled();
  });

  it('rolls back a grant when the processed marker fails, then persists exactly one duration on retry', async () => {
    const { service, prisma, orders, webhookEvents, entitlementService } = makeHarness();
    const entitlements: { startsAt: Date; expiresAt: Date }[] = [];
    const tx = Object.assign(prisma, {
      premiumEntitlement: {
        findFirst: jest.fn(async () => entitlements.at(-1) ?? null),
        create: jest.fn(async ({ data }: { data: { startsAt: Date; expiresAt: Date } }) => { entitlements.push(data); return data; }),
      },
    });
    const realEntitlements = new EntitlementService(tx as never);
    entitlementService.grantPremium.mockImplementation((transaction, userId, orderId, days) => realEntitlements.grantPremium(transaction, userId, orderId, days));
    prisma.$transaction.mockImplementation(async (fn) => {
      const beforeOrder = { ...orders.get(ORDER_ID)! };
      const beforeEvents = webhookEvents.map((event) => ({ ...event }));
      const beforeCount = entitlements.length;
      try { return await fn(tx); } catch (error) {
        orders.set(ORDER_ID, beforeOrder);
        webhookEvents.splice(0, webhookEvents.length, ...beforeEvents);
        entitlements.splice(beforeCount);
        throw error;
      }
    });
    prisma.paymentWebhookEvent.update.mockRejectedValueOnce(new Error('marker write failed'));
    await expect(service.handlePayOSWebhook({})).rejects.toThrow('marker write failed');
    expect(entitlements).toHaveLength(0);
    expect(orders.get(ORDER_ID)!.status).toBe('PENDING');
    expect(webhookEvents[0]!.status).toBe('VERIFIED');
    await service.handlePayOSWebhook({});
    expect(entitlements).toHaveLength(1);
    const expiry = entitlements[0]!.expiresAt.getTime();
    expect(expiry - entitlements[0]!.startsAt.getTime()).toBe(30 * 24 * 60 * 60 * 1000);
    await service.handlePayOSWebhook({});
    expect(entitlements).toHaveLength(1);
    expect(entitlements[0]!.expiresAt.getTime()).toBe(expiry);
  });

  it('does not swallow a unique error unless the matching event actually exists', async () => {
    const { service, prisma } = makeHarness();
    const error = new Prisma.PrismaClientKnownRequestError('Other unique key', { code: 'P2002', clientVersion: '5.22.0' });
    prisma.paymentWebhookEvent.create.mockRejectedValueOnce(error);
    await expect(service.handlePayOSWebhook({})).rejects.toBe(error);
  });
});

describe('PaymentWebhookService.handlePayOSWebhook — happy path', () => {
  it('transitions PENDING -> PAID and grants Premium exactly once', async () => {
    const { service, orders, entitlementService } = makeHarness();
    await service.handlePayOSWebhook({ any: 'payload' });
    expect(orders.get(ORDER_ID)!.status).toBe('PAID');
    expect(orders.get(ORDER_ID)!.paidAt).not.toBeNull();
    expect(entitlementService.grantPremium).toHaveBeenCalledTimes(1);
    expect(entitlementService.grantPremium).toHaveBeenCalledWith(expect.anything(), USER_ID, ORDER_ID, 30);
  });

  it('marks the webhook event PROCESSED', async () => {
    const { service, webhookEvents } = makeHarness();
    await service.handlePayOSWebhook({});
    expect(webhookEvents).toHaveLength(1);
    expect(webhookEvents[0]!.status).toBe('PROCESSED');
    expect(webhookEvents[0]!.processedAt).not.toBeNull();
  });

  it('a FAILED payment transitions the order to FAILED without granting entitlement', async () => {
    const { service, orders, entitlementService } = makeHarness({ verifyImpl: () => paidPayload({ status: 'FAILED' }) });
    await service.handlePayOSWebhook({});
    expect(orders.get(ORDER_ID)!.status).toBe('FAILED');
    expect(entitlementService.grantPremium).not.toHaveBeenCalled();
  });
});

describe('PaymentWebhookService.handlePayOSWebhook — forged/invalid webhooks are rejected', () => {
  it('rejects an invalid signature, records it as REJECTED, and never touches the order', async () => {
    const { service, orders, webhookEvents, entitlementService } = makeHarness({
      verifyImpl: () => {
        throw new PaymentProviderSignatureError();
      },
    });
    await expect(service.handlePayOSWebhook({})).rejects.toBeInstanceOf(BadRequestException);
    expect(orders.get(ORDER_ID)!.status).toBe('PENDING');
    expect(entitlementService.grantPremium).not.toHaveBeenCalled();
    expect(webhookEvents[0]!.status).toBe('REJECTED');
    expect(webhookEvents[0]!.errorCategory).toBe('INVALID_SIGNATURE');
  });

  it('rejects a webhook for an order that does not exist', async () => {
    const { service, webhookEvents, entitlementService } = makeHarness({ verifyImpl: () => paidPayload({ orderCode: 999999 }) });
    await expect(service.handlePayOSWebhook({})).rejects.toBeInstanceOf(BadRequestException);
    expect(entitlementService.grantPremium).not.toHaveBeenCalled();
    expect(webhookEvents[0]!.errorCategory).toBe('UNKNOWN_ORDER');
    expect(webhookEvents[0]!.orderId).toBeNull();
  });

  it('rejects a webhook whose amount does not match the order', async () => {
    const { service, orders, webhookEvents, entitlementService } = makeHarness({ verifyImpl: () => paidPayload({ amount: 1 }) });
    await expect(service.handlePayOSWebhook({})).rejects.toBeInstanceOf(BadRequestException);
    expect(orders.get(ORDER_ID)!.status).toBe('PENDING');
    expect(entitlementService.grantPremium).not.toHaveBeenCalled();
    expect(webhookEvents[0]!.errorCategory).toBe('AMOUNT_MISMATCH');
  });

  it('rejects a webhook whose currency does not match the order', async () => {
    const { service, webhookEvents, entitlementService } = makeHarness({ verifyImpl: () => paidPayload({ currency: 'USD' }) });
    await expect(service.handlePayOSWebhook({})).rejects.toBeInstanceOf(BadRequestException);
    expect(entitlementService.grantPremium).not.toHaveBeenCalled();
    expect(webhookEvents[0]!.errorCategory).toBe('CURRENCY_MISMATCH');
  });
});

// Sprint 11 — Notification & Retention Foundation: a `premium.activated` notification is created
// strictly downstream of a real entitlement grant, never in its place, and never breaks the
// webhook response if notification creation itself fails.
describe('PaymentWebhookService.handlePayOSWebhook — premium.activated notification (Sprint 11)', () => {
  it('creates a premium.activated notification, deduped by orderId, exactly when Premium is granted', async () => {
    const { service, notificationsService } = makeHarness();
    await service.handlePayOSWebhook({});
    expect(notificationsService.create).toHaveBeenCalledTimes(1);
    expect(notificationsService.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: USER_ID, type: 'premium.activated', dedupeKey: dedupeKeyForPremiumActivated(ORDER_ID) }),
    );
  });

  it('does not create a notification when the payment FAILED (no entitlement was granted)', async () => {
    const { service, notificationsService } = makeHarness({ verifyImpl: () => paidPayload({ status: 'FAILED' }) });
    await service.handlePayOSWebhook({});
    expect(notificationsService.create).not.toHaveBeenCalled();
  });

  it('does not create a notification when the account is inactive (entitlement grant itself was skipped)', async () => {
    const { service, notificationsService, entitlementService } = makeHarness({ userStatus: 'DELETED' });
    await service.handlePayOSWebhook({});
    expect(entitlementService.grantPremium).not.toHaveBeenCalled();
    expect(notificationsService.create).not.toHaveBeenCalled();
  });

  it('does not create a duplicate notification when a duplicate/late webhook delivery is a no-op (already-terminal order)', async () => {
    const { service, notificationsService } = makeHarness({ order: { status: 'PAID', paidAt: new Date() } });
    await service.handlePayOSWebhook({});
    expect(notificationsService.create).not.toHaveBeenCalled();
  });

  it('a notification-creation failure never breaks the webhook response — the payment side still succeeds', async () => {
    const { service, orders, notificationsService } = makeHarness();
    notificationsService.create.mockRejectedValueOnce(new Error('notification db unavailable'));
    await expect(service.handlePayOSWebhook({})).resolves.toBeUndefined();
    expect(orders.get(ORDER_ID)!.status).toBe('PAID');
  });
});

// Sprint 13 — `payment_success` analytics event, fired from the same `paidNow` signal the
// idempotency suite below already exercises for the order transition itself, deliberately never a
// second/separate dedup mechanism (see PaymentWebhookService's own docstring on this call site).
describe('PaymentWebhookService.handlePayOSWebhook — payment_success analytics event (Sprint 13)', () => {
  it('fires payment_success exactly once on the happy path', async () => {
    const { service, analyticsService } = makeHarness();
    await service.handlePayOSWebhook({});
    expect(analyticsService.trackServerEvent).toHaveBeenCalledTimes(1);
    expect(analyticsService.trackServerEvent).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'payment_success', userId: USER_ID }),
    );
  });

  it('does not fire when the webhook reports FAILED', async () => {
    const { service, analyticsService } = makeHarness({ verifyImpl: () => paidPayload({ status: 'FAILED' }) });
    await service.handlePayOSWebhook({});
    expect(analyticsService.trackServerEvent).not.toHaveBeenCalled();
  });

  it('still fires for a real payment even when the account is inactive — unlike the notification, this event represents money received, independent of whether an entitlement was also granted', async () => {
    const { service, analyticsService, entitlementService } = makeHarness({ userStatus: 'DELETED' });
    await service.handlePayOSWebhook({});
    expect(entitlementService.grantPremium).not.toHaveBeenCalled();
    expect(analyticsService.trackServerEvent).toHaveBeenCalledTimes(1);
    expect(analyticsService.trackServerEvent).toHaveBeenCalledWith(expect.objectContaining({ event: 'payment_success' }));
  });

  it('does not fire on a duplicate/already-terminal delivery (structurally idempotent via the same PENDING-only gate as the order transition, no second dedup mechanism)', async () => {
    const { service, analyticsService } = makeHarness({ order: { status: 'PAID', paidAt: new Date() } });
    await service.handlePayOSWebhook({});
    expect(analyticsService.trackServerEvent).not.toHaveBeenCalled();
  });

  it('does not double-fire on a byte-for-byte duplicate webhook delivery', async () => {
    const { service, analyticsService } = makeHarness();
    await service.handlePayOSWebhook({});
    await service.handlePayOSWebhook({});
    expect(analyticsService.trackServerEvent).toHaveBeenCalledTimes(1);
  });
});

describe('PaymentWebhookService.handlePayOSWebhook — idempotency & concurrency (Phase 6)', () => {
  it('a byte-for-byte duplicate delivery (same orderCode+reference) is a safe no-op, entitlement granted only once', async () => {
    const { service, orders, entitlementService, webhookEvents } = makeHarness();
    await service.handlePayOSWebhook({});
    await service.handlePayOSWebhook({}); // identical payload, identical externalEventId
    expect(orders.get(ORDER_ID)!.status).toBe('PAID');
    expect(entitlementService.grantPremium).toHaveBeenCalledTimes(1);
    expect(webhookEvents).toHaveLength(1); // the second insert failed the unique constraint and was never recorded again
  });

  it('two different webhook deliveries for the same already-PAID order (e.g. a provider retry with a new bank reference) never double-grant', async () => {
    let call = 0;
    const { service, orders, entitlementService } = makeHarness({
      verifyImpl: () => paidPayload({ reference: `FT-${++call}` }), // different externalEventId each time
    });
    await service.handlePayOSWebhook({});
    await service.handlePayOSWebhook({});
    expect(orders.get(ORDER_ID)!.status).toBe('PAID');
    expect(entitlementService.grantPremium).toHaveBeenCalledTimes(1); // second updateMany saw status != PENDING -> count 0 -> no grant
  });

  it('a stale FAILED event arriving after the order was already PAID never reverts it', async () => {
    let call = 0;
    const statuses: Array<'PAID' | 'FAILED'> = ['PAID', 'FAILED'];
    const { service, orders } = makeHarness({
      verifyImpl: () => paidPayload({ reference: `FT-${++call}`, status: statuses[call - 1] }),
    });
    await service.handlePayOSWebhook({}); // PAID first
    await service.handlePayOSWebhook({}); // stale FAILED second
    expect(orders.get(ORDER_ID)!.status).toBe('PAID');
  });
});

describe('PaymentWebhookService.handlePayOSWebhook — late delivery after account deletion (Sprint 10 closure)', () => {
  it('still transitions a late PAID webhook to PAID (accounting stays accurate) but does not grant a new entitlement to a DELETED account', async () => {
    const { service, orders, entitlementService } = makeHarness({ userStatus: 'DELETED' });
    await service.handlePayOSWebhook({});
    expect(orders.get(ORDER_ID)!.status).toBe('PAID');
    expect(orders.get(ORDER_ID)!.paidAt).not.toBeNull();
    expect(entitlementService.grantPremium).not.toHaveBeenCalled();
  });

  it('grants normally when the account is still ACTIVE (no regression)', async () => {
    const { service, orders, entitlementService } = makeHarness({ userStatus: 'ACTIVE' });
    await service.handlePayOSWebhook({});
    expect(orders.get(ORDER_ID)!.status).toBe('PAID');
    expect(entitlementService.grantPremium).toHaveBeenCalledTimes(1);
  });
});

// Production Activation Plan — the readiness audit found rejected webhook deliveries produced only
// a log line + DB audit row, never reaching Sentry, making a real payment-processing problem
// invisible outside manual inspection. This suite proves the fix: every rejection now also reaches
// Sentry, with only already-allowlisted, non-sensitive fields, and a Sentry-side failure can never
// break webhook processing itself.
describe('PaymentWebhookService.handlePayOSWebhook — Sentry visibility on rejection', () => {
  beforeEach(() => {
    (Sentry.captureMessage as jest.Mock).mockClear();
  });

  it('reports an invalid-signature rejection to Sentry with only the safe reason tag, no orderId (none resolved yet)', async () => {
    const { service } = makeHarness({
      verifyImpl: () => {
        throw new PaymentProviderSignatureError();
      },
    });
    await expect(service.handlePayOSWebhook({})).rejects.toBeInstanceOf(BadRequestException);
    expect(Sentry.captureMessage).toHaveBeenCalledTimes(1);
    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      'payment.webhook.rejected',
      expect.objectContaining({ tags: { payment: 'webhook', reason: 'INVALID_SIGNATURE' } }),
    );
  });

  it('reports an unknown-order rejection to Sentry with orderId undefined', async () => {
    const { service } = makeHarness({ verifyImpl: () => paidPayload({ orderCode: 999999 }) });
    await expect(service.handlePayOSWebhook({})).rejects.toBeInstanceOf(BadRequestException);
    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      'payment.webhook.rejected',
      expect.objectContaining({ tags: { payment: 'webhook', reason: 'UNKNOWN_ORDER' }, extra: { orderId: undefined } }),
    );
  });

  it('reports an amount-mismatch rejection to Sentry with the real orderId (an opaque identifier, not PII)', async () => {
    const { service } = makeHarness({ verifyImpl: () => paidPayload({ amount: 1 }) });
    await expect(service.handlePayOSWebhook({})).rejects.toBeInstanceOf(BadRequestException);
    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      'payment.webhook.rejected',
      expect.objectContaining({ tags: { payment: 'webhook', reason: 'AMOUNT_MISMATCH' }, extra: { orderId: ORDER_ID } }),
    );
  });

  it('never sends the raw webhook payload, a checkout URL, or free-text detail — only the fixed reason/orderId shape', async () => {
    const { service } = makeHarness({ verifyImpl: () => paidPayload({ currency: 'USD' }) });
    await expect(service.handlePayOSWebhook({ secret: 'checksum-value', checkoutUrl: 'https://payos.vn/checkout/abc', email: 'user@example.com' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    const [, payload] = (Sentry.captureMessage as jest.Mock).mock.calls[0] as [string, { tags: Record<string, string>; extra: Record<string, unknown> }];
    const serialized = JSON.stringify(payload);
    expect(serialized).not.toContain('checksum-value');
    expect(serialized).not.toContain('payos.vn/checkout');
    expect(serialized).not.toContain('user@example.com');
    expect(Object.keys(payload)).toEqual(['level', 'tags', 'extra']);
    expect(Object.keys(payload.extra)).toEqual(['orderId']);
  });

  it('does not report anything to Sentry on a successful (non-rejected) webhook', async () => {
    const { service } = makeHarness();
    await service.handlePayOSWebhook({});
    expect(Sentry.captureMessage).not.toHaveBeenCalled();
  });

  it('a Sentry-side failure never breaks webhook processing — the audit row is still written and the caller still gets its rejection', async () => {
    (Sentry.captureMessage as jest.Mock).mockImplementationOnce(() => {
      throw new Error('sentry transport unavailable');
    });
    const { service, webhookEvents } = makeHarness({
      verifyImpl: () => {
        throw new PaymentProviderSignatureError();
      },
    });
    await expect(service.handlePayOSWebhook({})).rejects.toBeInstanceOf(BadRequestException);
    expect(webhookEvents[0]!.status).toBe('REJECTED');
    expect(webhookEvents[0]!.errorCategory).toBe('INVALID_SIGNATURE');
  });

  it('a Sentry-side failure on one delivery does not affect a subsequent, unrelated delivery', async () => {
    (Sentry.captureMessage as jest.Mock).mockImplementationOnce(() => {
      throw new Error('sentry transport unavailable');
    });
    const { service: rejectedDelivery } = makeHarness({
      verifyImpl: () => {
        throw new PaymentProviderSignatureError();
      },
    });
    await expect(rejectedDelivery.handlePayOSWebhook({})).rejects.toBeInstanceOf(BadRequestException);

    const { service: paidDelivery, orders } = makeHarness();
    await paidDelivery.handlePayOSWebhook({});
    expect(orders.get(ORDER_ID)!.status).toBe('PAID');
  });
});
