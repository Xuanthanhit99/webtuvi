import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import type { PaymentWebhookEvent } from '@prisma/client';
import type { AppConfiguration } from '../../config/configuration';
import { PrismaService } from '../../prisma/prisma.service';
import { EntitlementService } from '../entitlement/entitlement.service';
import { PaymentProviderRegistryService } from '../providers/payment-provider-registry.service';
import { PaymentProviderSignatureError, type VerifiedWebhookPayment } from '../providers/payment-provider.interface';
import { NotificationsService } from '../../notifications/notifications.service';
import { dedupeKeyForPremiumActivated } from '../../notifications/eligibility/date-key.util';
import { AnalyticsService } from '../../analytics/analytics.service';

const REJECTED = Symbol('rejected');

/**
 * Phase 6 of the sprint brief — "CRITICAL". The full required pipeline, in order: verify signature
 * -> validate order exists -> validate amount -> validate currency -> validate payment state ->
 * check idempotency -> atomically transition the order + grant entitlement -> persist the result.
 *
 * Two independent idempotency layers guard against duplicate/concurrent webhook delivery:
 *  1. `PaymentWebhookEvent`'s `@@unique([provider, externalEventId])` constraint — a second insert
 *     of the same (orderCode, bank reference) pair fails at the DB level before any grant logic runs,
 *     safe even if two identical deliveries arrive at the same instant.
 *  2. The order transition itself is a conditional `updateMany({ where: { status: 'PENDING' } })`
 *     inside the same transaction as the entitlement grant — so even if two *different* webhook
 *     deliveries somehow both got past layer 1 (e.g. a provider retry with a new bank reference),
 *     only the first one to win the row-level update actually grants Premium; the second sees
 *     `count === 0` and is a safe no-op. A PAID order can never be reverted by a later FAILED event
 *     (the FAILED branch is also gated to `status: 'PENDING'` only).
 *
 * A webhook that fails signature verification, references an unknown order, or reports a mismatched
 * amount/currency is rejected (audited as `REJECTED` with a safe `errorCategory`, HTTP 400) and never
 * reaches the transaction below.
 */
@Injectable()
export class PaymentWebhookService {
  private readonly logger = new Logger('Payment');

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly providerRegistry: PaymentProviderRegistryService,
    private readonly entitlementService: EntitlementService,
    private readonly notifications: NotificationsService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  async handlePayOSWebhook(rawPayload: unknown): Promise<void> {
    const payloadHash = createHash('sha256').update(safeStringify(rawPayload)).digest('hex');

    const verified = await this.verifyOrAudit(rawPayload, payloadHash);
    if (verified === REJECTED) throw new BadRequestException({ code: 'PAYMENT_WEBHOOK_REJECTED', message: 'Webhook rejected.' });

    const externalEventId = `${verified.orderCode}:${verified.reference}`;
    const order = await this.prisma.paymentOrder.findUnique({ where: { providerOrderCode: String(verified.orderCode) } });
    if (!order) {
      await this.audit(externalEventId, null, payloadHash, 'UNKNOWN_ORDER', `orderCode=${verified.orderCode}`);
      throw new BadRequestException({ code: 'PAYMENT_WEBHOOK_REJECTED', message: 'Webhook rejected.' });
    }
    if (order.amount !== verified.amount) {
      await this.audit(externalEventId, order.id, payloadHash, 'AMOUNT_MISMATCH', `orderId=${order.id}`);
      throw new BadRequestException({ code: 'PAYMENT_WEBHOOK_REJECTED', message: 'Webhook rejected.' });
    }
    if (order.currency !== verified.currency) {
      await this.audit(externalEventId, order.id, payloadHash, 'CURRENCY_MISMATCH', `orderId=${order.id}`);
      throw new BadRequestException({ code: 'PAYMENT_WEBHOOK_REJECTED', message: 'Webhook rejected.' });
    }

    const event = await this.recordEventOrNull(externalEventId, order.id, payloadHash);
    if (!event) {
      this.logger.log(`payment.webhook.duplicate orderId=${order.id} externalEventId=${externalEventId}`);
      return;
    }

    const { granted, paidNow } = await this.applyPaymentResult(order.id, order.userId, verified, event.id);

    // Sprint 11 — strictly downstream of the transaction above, never inside it: a notification
    // failure must never roll back a real entitlement grant (see
    // docs/architecture/notification-retention.md "Payment integration"). If this call is never
    // reached because the process crashes between the transaction commit and here, no automatic
    // retry recreates it — a small, disclosed limitation (webhook redelivery from PayOS, if it
    // happens, would still safely no-op the entitlement grant per the PENDING-only gate above, and
    // could still yield a notification on that redelivery since `applyPaymentResult`'s `granted`
    // reflects that specific call's own outcome).
    if (granted) {
      await this.notifyPremiumActivated(order.userId, order.id).catch((error) => {
        this.logger.warn(`payment.notification.premium_activated_failed orderId=${order.id} error=${error instanceof Error ? error.message : 'unknown'}`);
      });
    }

    // Sprint 13 — same "downstream, never inside the transaction, best-effort" discipline as the
    // notification above. `paidNow` (not `granted`) is the right signal for this event: it means
    // this call is the one that actually flipped the order PENDING→PAID (real money received),
    // which is the fact `payment_success` represents — independent of the separate, rarer
    // ACTIVE-account gate that decides whether an entitlement was also minted. The PENDING-only
    // `updateMany` gate `applyPaymentResult` already uses for `paidNow` is exactly what makes this
    // structurally impossible to double-fire on a duplicate/retried webhook delivery, with no
    // second dedup mechanism needed.
    if (paidNow) {
      void this.analyticsService.trackServerEvent({ event: 'payment_success', userId: order.userId, properties: { feature: 'premium' } });
    }
  }

  /** Best-effort by design (caught at the call site above) — never allowed to affect the payment
   * response the webhook caller receives, and never re-derives payment state itself (Sprint 11
   * brief §29: "notification is downstream of payment state," "never grant Premium from
   * notification code"). In-app only for Sprint 11 — no email: the checkout return page already
   * gives the buyer a real-time confirmation, so an email receipt is deliberately out of scope
   * rather than a duplicated, redundant channel (see docs/architecture/notification-retention.md
   * "Initial retention events"). */
  private async notifyPremiumActivated(userId: string, orderId: string): Promise<void> {
    await this.notifications.create({
      userId,
      type: 'premium.activated',
      title: 'Premium is active',
      body: 'Your Premium pass is active — deeper Companion memory, longer history, and priority access are ready now.',
      deepLink: '/settings',
      dedupeKey: dedupeKeyForPremiumActivated(orderId),
    });
  }

  private async verifyOrAudit(rawPayload: unknown, payloadHash: string): Promise<VerifiedWebhookPayment | typeof REJECTED> {
    if (!this.providerRegistry.has('payos')) {
      await this.audit(`no-provider:${Date.now()}`, null, payloadHash, 'PROVIDER_UNAVAILABLE', 'payos not configured');
      return REJECTED;
    }
    try {
      return this.providerRegistry.get('payos').verifyWebhook(rawPayload);
    } catch (error) {
      const category = error instanceof PaymentProviderSignatureError ? 'INVALID_SIGNATURE' : 'MALFORMED_PAYLOAD';
      await this.audit(`unverified:${Date.now()}`, null, payloadHash, category, 'signature/schema check failed');
      return REJECTED;
    }
  }

  private async applyPaymentResult(
    orderId: string,
    userId: string,
    verified: VerifiedWebhookPayment,
    webhookEventId: string,
  ): Promise<{ granted: boolean; paidNow: boolean }> {
    const config = this.configService.get<AppConfiguration>('app')!;

    return this.prisma.$transaction(async (tx) => {
      let granted = false;
      let paidNow = false;

      if (verified.status === 'PAID') {
        // Only transitions a still-PENDING order — a duplicate/late/stale PAID event for an
        // already-terminal order is a safe no-op, never regrants and never reverts. The order
        // itself always transitions to PAID regardless of the account's current status (a real
        // payment happened; the accounting record must reflect that), but a *new* Premium
        // entitlement is only granted to a still-ACTIVE account — a late webhook arriving after
        // the buyer deleted their own account (Sprint 10) must never mint a fresh, dormant
        // entitlement against a scrubbed user id. See docs/architecture/account-data-rights.md §7.
        const result = await tx.paymentOrder.updateMany({ where: { id: orderId, status: 'PENDING' }, data: { status: 'PAID', paidAt: new Date() } });
        if (result.count > 0) {
          paidNow = true;
          const user = await tx.user.findUnique({ where: { id: userId }, select: { status: true } });
          if (user?.status === 'ACTIVE') {
            await this.entitlementService.grantPremium(tx, userId, orderId, config.payment.premium.durationDays);
            this.logger.log(`payment.entitlement.granted orderId=${orderId} userId=${userId}`);
            granted = true;
          } else {
            this.logger.log(`payment.entitlement.skipped_inactive_account orderId=${orderId} userId=${userId}`);
          }
        } else {
          this.logger.log(`payment.webhook.noop_already_terminal orderId=${orderId}`);
        }
      } else {
        // A PAID order must never be reverted by a later FAILED/CANCELLED event — gated to PENDING only.
        await tx.paymentOrder.updateMany({ where: { id: orderId, status: 'PENDING' }, data: { status: 'FAILED', failedAt: new Date() } });
      }

      await tx.paymentWebhookEvent.update({ where: { id: webhookEventId }, data: { status: 'PROCESSED', processedAt: new Date() } });

      return { granted, paidNow };
    });
  }

  /** Returns the created ledger row, or `null` if this (provider, externalEventId) pair already
   * exists — the unique-constraint violation is the actual duplicate-safety mechanism, not the
   * lookup-then-insert around it (which would itself race under true concurrency). */
  private async recordEventOrNull(externalEventId: string, orderId: string, payloadHash: string): Promise<PaymentWebhookEvent | null> {
    try {
      return await this.prisma.paymentWebhookEvent.create({
        data: { provider: 'PAYOS', externalEventId, orderId, payloadHash, status: 'VERIFIED' },
      });
    } catch {
      return null;
    }
  }

  /** Best-effort audit row for a rejected delivery — never throws itself, so a duplicate rejected
   * delivery (or any other insert failure) doesn't mask the caller's own rejection response. */
  private async audit(externalEventId: string, orderId: string | null, payloadHash: string, errorCategory: string, detail: string): Promise<void> {
    this.logger.warn(`payment.webhook.rejected reason=${errorCategory} ${detail}`);
    try {
      await this.prisma.paymentWebhookEvent.create({
        data: { provider: 'PAYOS', externalEventId, orderId, payloadHash, status: 'REJECTED', errorCategory },
      });
    } catch {
      // best-effort only
    }
  }
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value) ?? '';
  } catch {
    return '';
  }
}
