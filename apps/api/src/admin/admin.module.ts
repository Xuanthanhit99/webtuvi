import { Module } from '@nestjs/common';
import { PaymentModule } from '../payment/payment.module';
import { AdminController } from './admin.controller';
import { AdminUserLookupService } from './lookups/admin-user-lookup.service';
import { AdminPaymentLookupService } from './lookups/admin-payment-lookup.service';
import { AdminNotificationHealthService } from './lookups/admin-notification-health.service';
import { AdminAiSpendService } from './lookups/admin-ai-spend.service';

/**
 * Interim Sprint — Admin Operator Tooling (while Vietnamese Tử Vi Sprint 18 remains
 * BLOCKED_BY_DOMAIN_REFERENCE — see docs/audit/sprint-18-pre-implementation-audit.md). Five
 * read-only operator lookups; zero write/mutation endpoints. Full design:
 * docs/architecture/admin-operator-tooling.md.
 *
 * Imports `PaymentModule` for `EntitlementService` only — never a parallel entitlement query, per
 * that service's own "the one authoritative place Premium decisions converge" rule.
 */
@Module({
  imports: [PaymentModule],
  controllers: [AdminController],
  providers: [AdminUserLookupService, AdminPaymentLookupService, AdminNotificationHealthService, AdminAiSpendService],
})
export class AdminModule {}
