import type { UserRole, UserStatus, PaymentOrderStatus, PaymentProductCode, PaymentProviderCode, NotificationDeliveryStatus } from '@prisma/client';
import type { EffectiveEntitlementStatus } from '../payment/entitlement/entitlement.service';

/**
 * Interim Sprint — Admin Operator Tooling response shapes. Every field here is an explicit,
 * hand-picked ALLOW-listed value — see docs/audit/admin-operator-tooling-pre-implementation-audit.md
 * §6/§9/§10/§15 for the exact ALLOW/DENY reasoning per field. No mapper in this module ever spreads
 * a Prisma object (`{ ...user }`) — every DTO below is built field-by-field in admin.mappers.ts, the
 * same discipline `eastern-horoscope.mappers.ts`/`users.service.ts#toDto` already use.
 */

export interface AdminUserLookupDto {
  id: string;
  email: string;
  displayName: string;
  status: UserStatus;
  role: UserRole;
  createdAt: string;
  emailVerifiedAt: string | null;
  onboardingCompletedAt: string | null;
  /** From `EntitlementService.hasPremiumAccess` — never a parallel query, never a stored flag. */
  isPremium: boolean;
}

export interface AdminEntitlementRecordDto {
  id: string;
  status: EffectiveEntitlementStatus;
  source: 'PAYMENT';
  startsAt: string;
  expiresAt: string | null;
  grantedAt: string;
  orderId: string;
}

export interface AdminPaymentOrderDto {
  id: string;
  product: PaymentProductCode;
  amount: number;
  currency: string;
  provider: PaymentProviderCode;
  providerOrderCode: string;
  status: PaymentOrderStatus;
  createdAt: string;
  paidAt: string | null;
  failedAt: string | null;
  expiresAt: string | null;
  /** Linkage only — never the full entitlement record inline; call the entitlement lookup for
   * effective status (which requires the same now-relative computation `EntitlementService` already
   * owns — not duplicated here). */
  entitlement: { id: string } | null;
}

export interface AdminNotificationHealthWindowDto {
  type: string;
  emailStatus: NotificationDeliveryStatus;
  count: number;
}

export interface AdminNotificationHealthDto {
  /** Explicit, not silently omitted — see
   * docs/audit/admin-operator-tooling-pre-implementation-audit.md §8: the scheduler run itself
   * reports only to logs/Sentry, never to a persisted table, so "did today's run execute" cannot be
   * answered from this response. This field exists so the UI can say so plainly instead of a blank
   * space implying the data was simply forgotten. */
  schedulerRunTelemetry: 'NOT_COLLECTED';
  last24h: AdminNotificationHealthWindowDto[];
  last7d: AdminNotificationHealthWindowDto[];
}

export interface AdminAiSpendDto {
  window: 'today' | '7d';
  filters: { feature: string | null; provider: string | null; userId: string | null };
  estimatedCostUsd: number;
  requestCount: number;
  /** `null` when `filters.userId` is set — `ProviderLog` has no `userId` column, so a per-user
   * failure rate cannot be derived and must not be faked via a `sourceId` join. See
   * `AdminAiSpendService`'s own doc comment. */
  failureCount: number | null;
}
