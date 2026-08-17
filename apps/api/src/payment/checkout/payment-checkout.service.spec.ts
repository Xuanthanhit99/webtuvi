import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PaymentCheckoutService } from './payment-checkout.service';

const USER = 'user-1';

function makeHarness(options: { providerAvailable?: boolean; paymentsEnabled?: boolean; createPaymentImpl?: (input: unknown) => Promise<{ checkoutUrl: string; providerPaymentLinkId: string }> } = {}) {
  const orders = new Map<string, Record<string, unknown>>();
  let seq = 0;

  const paymentOrder = {
    create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
      const id = `order-${++seq}`;
      const row = { id, createdAt: new Date(), updatedAt: new Date(), providerCheckoutUrl: null, providerPaymentLinkId: null, paidAt: null, failedAt: null, ...data };
      orders.set(id, row);
      return row;
    }),
    update: jest.fn(async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
      const row = orders.get(where.id)!;
      Object.assign(row, data);
      return row;
    }),
    findUnique: jest.fn(async ({ where }: { where: { id: string } }) => orders.get(where.id) ?? null),
  };

  const prisma = { paymentOrder };
  const configService = {
    get: jest.fn().mockReturnValue({
      frontendUrl: 'https://app.example.com',
      payment: { enabled: options.paymentsEnabled ?? true, premium: { priceVnd: 79000 } },
    }),
  };
  const createPayment = jest.fn(
    options.createPaymentImpl ?? (async (_input: unknown) => ({ checkoutUrl: 'https://pay.payos.vn/web/abc', providerPaymentLinkId: 'link-abc' })),
  );
  const providerRegistry = {
    has: jest.fn().mockReturnValue(options.providerAvailable ?? true),
    get: jest.fn().mockReturnValue({ createPayment }),
  };

  const analyticsService = { trackServerEvent: jest.fn().mockResolvedValue(undefined) };
  const service = new PaymentCheckoutService(prisma as never, configService as never, providerRegistry as never, analyticsService as never);
  return { service, prisma, orders, createPayment, providerRegistry, analyticsService };
}

describe('PaymentCheckoutService.createCheckout', () => {
  it('creates a PENDING order priced from backend config, never from client input', async () => {
    const { service, orders } = makeHarness();
    const dto = await service.createCheckout(USER);
    expect(dto.amount).toBe(79000);
    expect(dto.currency).toBe('VND');
    expect(dto.product).toBe('PREMIUM_30D');
    expect(dto.status).toBe('PENDING');
    expect(dto.checkoutUrl).toBe('https://pay.payos.vn/web/abc');
    const stored = [...orders.values()][0]!;
    expect(stored.userId).toBe(USER);
    expect(stored.amount).toBe(79000);
  });

  it('passes a backend-built returnUrl/cancelUrl to the provider, never client-supplied ones', async () => {
    const { service, createPayment } = makeHarness();
    await service.createCheckout(USER);
    const call = createPayment.mock.calls[0]![0] as { returnUrl: string; cancelUrl: string; amount: number };
    expect(call.returnUrl).toMatch(/^https:\/\/app\.example\.com\/premium\/return\?order=order-1$/);
    expect(call.cancelUrl).toBe('https://app.example.com/premium?cancelled=1');
    expect(call.amount).toBe(79000);
  });

  it('returns PAYMENT_PROVIDER_UNAVAILABLE without creating an order when PayOS is not configured', async () => {
    const { service, orders } = makeHarness({ providerAvailable: false });
    await expect(service.createCheckout(USER)).rejects.toMatchObject({ response: { code: 'PAYMENT_PROVIDER_UNAVAILABLE' } });
    expect(orders.size).toBe(0);
  });

  it('returns PAYMENTS_DISABLED without creating an order or touching the provider when the kill switch is off', async () => {
    const { service, orders, providerRegistry } = makeHarness({ paymentsEnabled: false });
    await expect(service.createCheckout(USER)).rejects.toMatchObject({ response: { code: 'PAYMENTS_DISABLED' } });
    expect(orders.size).toBe(0);
    expect(providerRegistry.has).not.toHaveBeenCalled();
  });

  it('marks the order FAILED (not left PENDING forever) if the provider call throws', async () => {
    const { service, orders } = makeHarness({
      createPaymentImpl: async () => {
        throw new Error('network error');
      },
    });
    await expect(service.createCheckout(USER)).rejects.toBeInstanceOf(BadRequestException);
    const stored = [...orders.values()][0]!;
    expect(stored.status).toBe('FAILED');
  });
});

describe('PaymentCheckoutService.getOrder — ownership', () => {
  it('returns the order for its owner', async () => {
    const { service } = makeHarness();
    const created = await service.createCheckout(USER);
    const fetched = await service.getOrder(USER, created.id);
    expect(fetched.id).toBe(created.id);
  });

  it('404s for another user requesting someone else’s order (cross-user isolation)', async () => {
    const { service } = makeHarness();
    const created = await service.createCheckout(USER);
    await expect(service.getOrder('someone-else', created.id)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('404s for a nonexistent order id', async () => {
    const { service } = makeHarness();
    await expect(service.getOrder(USER, 'does-not-exist')).rejects.toBeInstanceOf(NotFoundException);
  });
});
