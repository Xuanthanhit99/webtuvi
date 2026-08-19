import type {
  AdminUserLookupDto,
  AdminEntitlementRecordDto,
  AdminPaymentOrderDto,
  AdminNotificationHealthDto,
  AdminAiSpendDto,
} from '@beaconvie/types';
import { api } from '@/lib/api-client';

export interface AdminAiSpendFilters {
  window: 'today' | '7d';
  feature?: string;
  provider?: string;
  userId?: string;
}

function toQuery(params: object): string {
  const search = new URLSearchParams();
  Object.entries(params as Record<string, string | undefined>).forEach(([key, value]) => {
    if (value !== undefined && value !== '') search.set(key, value);
  });
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

/** Interim Sprint — Admin Operator Tooling. Every call here requires the caller to already hold an
 * ADMIN-role session — the API's own AdminGuard is the real enforcement point (re-checked live on
 * every request), not anything in this file. */
export const adminApi = {
  lookupUserByEmail: (email: string) => api.get<AdminUserLookupDto>(`/admin/users/lookup${toQuery({ email })}`),
  lookupUserById: (id: string) => api.get<AdminUserLookupDto>(`/admin/users/lookup${toQuery({ id })}`),
  getEntitlement: (userId: string) => api.get<AdminEntitlementRecordDto[]>(`/admin/users/${userId}/entitlement`),
  getPaymentsForUser: (userId: string) => api.get<AdminPaymentOrderDto[]>(`/admin/users/${userId}/payments`),
  getPayment: (orderId: string) => api.get<AdminPaymentOrderDto>(`/admin/payments/${orderId}`),
  getNotificationHealth: () => api.get<AdminNotificationHealthDto>('/admin/notifications/health'),
  getAiSpend: (filters: AdminAiSpendFilters) => api.get<AdminAiSpendDto>(`/admin/ai-spend${toQuery(filters)}`),
};
