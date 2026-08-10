import type { PaymentOrderDto, PremiumStatusDto } from '@beaconvie/types';
import { api } from '@/lib/api-client';

/** Every value here is backend-decided (price, product, entitlement, payment state) — this client
 * never sends or trusts a price/product/success flag of its own. See
 * docs/architecture/payment-foundation.md "Checkout flow". */
export const premiumApi = {
  status: () => api.get<PremiumStatusDto>('/payment/premium-status'),
  checkout: () => api.post<PaymentOrderDto>('/payment/checkout'),
  getOrder: (id: string) => api.get<PaymentOrderDto>(`/payment/orders/${id}`),
};
