import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentProviderRegistryService } from './providers/payment-provider-registry.service';
import { PaymentCheckoutService } from './checkout/payment-checkout.service';
import { PaymentWebhookService } from './webhook/payment-webhook.service';
import { EntitlementService } from './entitlement/entitlement.service';
import { PremiumGuard } from './entitlement/premium.guard';

/**
 * Premium & Payment Foundation (Sprint 7) — the product's first real monetization path (Product
 * Bible Module 17, narrowed to a single tier/provider). One paid product (PREMIUM_30D), one
 * provider (PayOS), one authoritative entitlement layer. See
 * docs/architecture/premium-entitlements.md and docs/architecture/payment-foundation.md.
 *
 * `EntitlementService` and `PremiumGuard` are exported so other feature modules (Tarot) can
 * converge their own Premium checks through this one place, rather than re-implementing them.
 */
@Module({
  controllers: [PaymentController],
  providers: [PaymentProviderRegistryService, PaymentCheckoutService, PaymentWebhookService, EntitlementService, PremiumGuard],
  exports: [EntitlementService, PremiumGuard],
})
export class PaymentModule {}
