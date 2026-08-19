import { NotFoundException } from '@nestjs/common';
import { AdminPaymentLookupService } from './admin-payment-lookup.service';

describe('AdminPaymentLookupService', () => {
  const now = new Date('2026-01-01T00:00:00.000Z');
  const order = {
    id: 'order-1',
    userId: 'user-1',
    product: 'PREMIUM_30D',
    amount: 79000,
    currency: 'VND',
    provider: 'PAYOS',
    providerOrderCode: 'BCV-000001',
    providerPaymentLinkId: 'sensitive-checkout-link-id',
    providerCheckoutUrl: 'https://pay.payos.vn/web/sensitive-checkout-token',
    status: 'PAID',
    createdAt: now,
    updatedAt: now,
    paidAt: now,
    failedAt: null,
    expiresAt: null,
    metadata: { description: 'checkout description', internalNote: 'never expose me' },
    entitlement: { id: 'entitlement-1' },
  };

  function makeService(orderRows: typeof order[] | typeof order | null, userExists = true) {
    const prisma = {
      paymentOrder: {
        findMany: jest.fn().mockResolvedValue(Array.isArray(orderRows) ? orderRows : []),
        findUnique: jest.fn().mockResolvedValue(Array.isArray(orderRows) ? null : orderRows),
      },
    };
    const userLookup = { assertUserExists: jest.fn().mockResolvedValue(userExists ? undefined : Promise.reject(new NotFoundException())) };
    const service = new AdminPaymentLookupService(prisma as never, userLookup as never);
    return { service, prisma, userLookup };
  }

  it('listForUser returns only the ALLOW-listed fields, never providerPaymentLinkId/providerCheckoutUrl/metadata', async () => {
    const { service } = makeService([order]);
    const [dto] = await service.listForUser('user-1');
    expect(dto).toEqual({
      id: 'order-1',
      product: 'PREMIUM_30D',
      amount: 79000,
      currency: 'VND',
      provider: 'PAYOS',
      providerOrderCode: 'BCV-000001',
      status: 'PAID',
      createdAt: now.toISOString(),
      paidAt: now.toISOString(),
      failedAt: null,
      expiresAt: null,
      entitlement: { id: 'entitlement-1' },
    });
    expect(dto).not.toHaveProperty('providerPaymentLinkId');
    expect(dto).not.toHaveProperty('providerCheckoutUrl');
    expect(dto).not.toHaveProperty('metadata');
    const serialized = JSON.stringify(dto);
    expect(serialized).not.toContain('sensitive-checkout-link-id');
    expect(serialized).not.toContain('sensitive-checkout-token');
    expect(serialized).not.toContain('never expose me');
  });

  it('listForUser checks user existence first via the shared helper, never a parallel query', async () => {
    const { service, userLookup } = makeService([order]);
    await service.listForUser('user-1');
    expect(userLookup.assertUserExists).toHaveBeenCalledWith('user-1');
  });

  it('getOrder throws NotFoundException for an unknown order id', async () => {
    const { service } = makeService(null);
    await expect(service.getOrder('nope')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('getOrder returns a null entitlement linkage when the order has none', async () => {
    const { service, prisma } = makeService(null);
    (prisma.paymentOrder.findUnique as jest.Mock).mockResolvedValueOnce({ ...order, entitlement: null });
    const dto = await service.getOrder('order-1');
    expect(dto.entitlement).toBeNull();
  });
});
