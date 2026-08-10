-- CreateEnum
CREATE TYPE "PaymentProviderCode" AS ENUM ('PAYOS');

-- CreateEnum
CREATE TYPE "PaymentProductCode" AS ENUM ('PREMIUM_30D');

-- CreateEnum
CREATE TYPE "PaymentOrderStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentWebhookStatus" AS ENUM ('RECEIVED', 'VERIFIED', 'REJECTED', 'PROCESSED', 'ERROR');

-- CreateEnum
CREATE TYPE "PremiumEntitlementStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "PremiumEntitlementSource" AS ENUM ('PAYMENT');

-- CreateTable
CREATE TABLE "payment_orders" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "product" "PaymentProductCode" NOT NULL DEFAULT 'PREMIUM_30D',
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'VND',
    "provider" "PaymentProviderCode" NOT NULL,
    "providerOrderCode" TEXT NOT NULL,
    "providerPaymentLinkId" TEXT,
    "providerCheckoutUrl" TEXT,
    "status" "PaymentOrderStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "metadata" JSONB,

    CONSTRAINT "payment_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_webhook_events" (
    "id" TEXT NOT NULL,
    "provider" "PaymentProviderCode" NOT NULL,
    "externalEventId" TEXT NOT NULL,
    "orderId" TEXT,
    "payloadHash" TEXT NOT NULL,
    "status" "PaymentWebhookStatus" NOT NULL DEFAULT 'RECEIVED',
    "errorCategory" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "payment_webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "premium_entitlements" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "PremiumEntitlementStatus" NOT NULL DEFAULT 'ACTIVE',
    "source" "PremiumEntitlementSource" NOT NULL DEFAULT 'PAYMENT',
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "orderId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "premium_entitlements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payment_orders_providerOrderCode_key" ON "payment_orders"("providerOrderCode");

-- CreateIndex
CREATE INDEX "payment_orders_userId_status_idx" ON "payment_orders"("userId", "status");

-- CreateIndex
CREATE INDEX "payment_orders_provider_providerOrderCode_idx" ON "payment_orders"("provider", "providerOrderCode");

-- CreateIndex
CREATE UNIQUE INDEX "payment_webhook_events_provider_externalEventId_key" ON "payment_webhook_events"("provider", "externalEventId");

-- CreateIndex
CREATE INDEX "payment_webhook_events_orderId_idx" ON "payment_webhook_events"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "premium_entitlements_orderId_key" ON "premium_entitlements"("orderId");

-- CreateIndex
CREATE INDEX "premium_entitlements_userId_status_idx" ON "premium_entitlements"("userId", "status");

-- CreateIndex
CREATE INDEX "premium_entitlements_userId_expiresAt_idx" ON "premium_entitlements"("userId", "expiresAt");

-- AddForeignKey
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_webhook_events" ADD CONSTRAINT "payment_webhook_events_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "payment_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "premium_entitlements" ADD CONSTRAINT "premium_entitlements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "premium_entitlements" ADD CONSTRAINT "premium_entitlements_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "payment_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
