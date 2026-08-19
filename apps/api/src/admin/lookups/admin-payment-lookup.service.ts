import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminUserLookupService } from './admin-user-lookup.service';
import { toAdminPaymentOrderDto } from '../admin.mappers';
import type { AdminPaymentOrderDto } from '../admin.types';

/**
 * Interim Sprint — Admin Operator Tooling. Read-only. Never returns `providerPaymentLinkId`,
 * `providerCheckoutUrl`, raw `metadata`, or `PaymentWebhookEvent.payloadHash` — see
 * docs/audit/admin-operator-tooling-pre-implementation-audit.md §6. No refund/retry/repair action
 * exists anywhere in this file.
 */
@Injectable()
export class AdminPaymentLookupService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userLookup: AdminUserLookupService,
  ) {}

  async listForUser(userId: string): Promise<AdminPaymentOrderDto[]> {
    await this.userLookup.assertUserExists(userId);

    const orders = await this.prisma.paymentOrder.findMany({
      where: { userId },
      include: { entitlement: { select: { id: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return orders.map((order) => toAdminPaymentOrderDto(order, order.entitlement));
  }

  async getOrder(orderId: string): Promise<AdminPaymentOrderDto> {
    const order = await this.prisma.paymentOrder.findUnique({
      where: { id: orderId },
      include: { entitlement: { select: { id: true } } },
    });
    if (!order) {
      throw new NotFoundException({ code: 'ADMIN_ORDER_NOT_FOUND', message: 'No order found for that id.' });
    }
    return toAdminPaymentOrderDto(order, order.entitlement);
  }
}
