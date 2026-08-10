import type { PaymentOrder } from '@prisma/client';
import type { PaymentOrderDto } from '@beaconvie/types';

/** Client-safe projection of a PaymentOrder — deliberately excludes `providerOrderCode` and
 * `providerPaymentLinkId` (internal correlation ids the frontend never needs) and `metadata`. */
export function toPaymentOrderDto(order: PaymentOrder): PaymentOrderDto {
  return {
    id: order.id,
    status: order.status,
    product: order.product,
    amount: order.amount,
    currency: order.currency,
    checkoutUrl: order.providerCheckoutUrl,
    createdAt: order.createdAt.toISOString(),
    paidAt: order.paidAt ? order.paidAt.toISOString() : null,
  };
}
