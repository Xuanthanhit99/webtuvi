import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { AdminThrottlerGuard } from '../common/guards/admin-throttler.guard';
import { EntitlementService, type PremiumEntitlementRecord } from '../payment/entitlement/entitlement.service';
import { AdminUserLookupService } from './lookups/admin-user-lookup.service';
import { AdminPaymentLookupService } from './lookups/admin-payment-lookup.service';
import { AdminNotificationHealthService } from './lookups/admin-notification-health.service';
import { AdminAiSpendService } from './lookups/admin-ai-spend.service';
import { AdminUserLookupQueryDto } from './dto/admin-user-lookup-query.dto';
import { AdminAiSpendQueryDto } from './dto/admin-ai-spend-query.dto';
import type { AdminUserLookupDto, AdminPaymentOrderDto, AdminNotificationHealthDto, AdminAiSpendDto } from './admin.types';

const SKIP_UNRELATED_THROTTLERS = {
  auth: true,
  companion: true,
  'companion-ip': true,
  payment: true,
  discovery: true,
  'discovery-ip': true,
};

/**
 * Interim Sprint — Admin Operator Tooling. Every route: `JwtAuthGuard` (authenticates AND re-checks
 * current DB `status`/`role` live, every request — see that guard's own doc comment) → `AdminGuard`
 * (rejects anything but `role === 'ADMIN'`) → `AdminThrottlerGuard`. Read-only, exact-match lookups
 * only — no list-all, no bulk export, no write/mutation endpoint of any kind. See
 * docs/audit/admin-operator-tooling-pre-implementation-audit.md for the full threat model and field-
 * level ALLOW/DENY reasoning this controller implements.
 */
@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard, AdminThrottlerGuard)
@SkipThrottle(SKIP_UNRELATED_THROTTLERS)
export class AdminController {
  constructor(
    private readonly userLookup: AdminUserLookupService,
    private readonly paymentLookup: AdminPaymentLookupService,
    private readonly notificationHealth: AdminNotificationHealthService,
    private readonly aiSpend: AdminAiSpendService,
    private readonly entitlementService: EntitlementService,
  ) {}

  @Get('users/lookup')
  @ApiOperation({ summary: 'Exact-match user lookup by email or id (operator only)' })
  lookupUser(@Query() query: AdminUserLookupQueryDto): Promise<AdminUserLookupDto> {
    return this.userLookup.lookup(query);
  }

  @Get('users/:id/entitlement')
  @ApiOperation({ summary: "A user's Premium entitlement history (read-only — no grant/revoke)" })
  async getEntitlement(@Param('id') id: string): Promise<PremiumEntitlementRecord[]> {
    await this.userLookup.assertUserExists(id);
    return this.entitlementService.getUserEntitlements(id);
  }

  @Get('users/:id/payments')
  @ApiOperation({ summary: "A user's payment/order history (read-only, safe fields only)" })
  getPaymentsForUser(@Param('id') id: string): Promise<AdminPaymentOrderDto[]> {
    return this.paymentLookup.listForUser(id);
  }

  @Get('payments/:orderId')
  @ApiOperation({ summary: 'Direct payment/order lookup by internal order id' })
  getPayment(@Param('orderId') orderId: string): Promise<AdminPaymentOrderDto> {
    return this.paymentLookup.getOrder(orderId);
  }

  @Get('notifications/health')
  @ApiOperation({ summary: 'Aggregate notification delivery health (last 24h / last 7d) — not user-scoped' })
  getNotificationHealth(): Promise<AdminNotificationHealthDto> {
    return this.notificationHealth.getHealth();
  }

  @Get('ai-spend')
  @ApiOperation({ summary: 'Aggregate AI spend/requests/failures — never prompt or completion content' })
  getAiSpend(@Query() query: AdminAiSpendQueryDto): Promise<AdminAiSpendDto> {
    return this.aiSpend.getSpend(query);
  }
}
