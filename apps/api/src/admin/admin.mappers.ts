import type { User, PaymentOrder } from '@prisma/client';
import type { AdminUserLookupDto, AdminPaymentOrderDto } from './admin.types';

/** Field-by-field only — never `{ ...user }`. `passwordHash` and every other secret/session field
 * is structurally absent because it is never read into this function's parameter selection in the
 * first place (see `AdminUserLookupService`'s `select`). */
export function toAdminUserLookupDto(user: User, isPremium: boolean): AdminUserLookupDto {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    status: user.status,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
    emailVerifiedAt: user.emailVerifiedAt ? user.emailVerifiedAt.toISOString() : null,
    onboardingCompletedAt: user.onboardingCompletedAt ? user.onboardingCompletedAt.toISOString() : null,
    isPremium,
  };
}

/** DENY-listed by omission: `providerPaymentLinkId`, `providerCheckoutUrl`, `metadata` — see
 * docs/audit/admin-operator-tooling-pre-implementation-audit.md §6. */
export function toAdminPaymentOrderDto(order: PaymentOrder, entitlement: { id: string } | null): AdminPaymentOrderDto {
  return {
    id: order.id,
    product: order.product,
    amount: order.amount,
    currency: order.currency,
    provider: order.provider,
    providerOrderCode: order.providerOrderCode,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    paidAt: order.paidAt ? order.paidAt.toISOString() : null,
    failedAt: order.failedAt ? order.failedAt.toISOString() : null,
    expiresAt: order.expiresAt ? order.expiresAt.toISOString() : null,
    entitlement: entitlement ? { id: entitlement.id } : null,
  };
}
