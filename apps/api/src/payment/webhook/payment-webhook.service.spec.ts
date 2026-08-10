import { BadRequestException } from '@nestjs/common';
import { PaymentWebhookService } from './payment-webhook.service';
import { PaymentProviderSignatureError, type VerifiedWebhookPayment } from '../providers/payment-provider.interface';

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

function makeHarness(options: { verifyImpl?: (payload: unknown) => VerifiedWebhookPayment; order?: Partial<OrderRow> } = {}) {
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
    create: jest.fn(async ({ data }: { data: { provider: string; externalEventId: string; orderId: string | null; status: string; errorCategory?: string } }) => {
      const exists = webhookEvents.find((e) => e.provider === data.provider && e.externalEventId === data.externalEventId);
      if (exists) throw Object.assign(new Error('Unique constraint failed on the fields: (`provider`,`externalEventId`)'), { code: 'P2002' });
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
    $transaction: undefined as unknown as jest.Mock<Promise<unknown>, [(tx: unknown) => Promise<unknown>]>,
  };
  prisma.$transaction = jest.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn(prisma));

  const verifyWebhook = jest.fn(options.verifyImpl ?? (() => paidPayload()));
  const providerRegistry = { has: jest.fn().mockReturnValue(true), get: jest.fn().mockReturnValue({ verifyWebhook }) };
  const entitlementService = { grantPremium: jest.fn().mockResolvedValue(undefined) };
  const configService = { get: jest.fn().mockReturnValue({ payment: { premium: { durationDays: 30 } } }) };

  const service = new PaymentWebhookService(prisma as never, configService as never, providerRegistry as never, entitlementService as never);
  return { service, prisma, orders, webhookEvents, verifyWebhook, entitlementService };
}

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
