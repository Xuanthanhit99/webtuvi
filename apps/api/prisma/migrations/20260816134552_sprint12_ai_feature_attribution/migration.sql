-- CreateEnum
CREATE TYPE "AIFeature" AS ENUM ('COMPANION', 'TAROT', 'NUMEROLOGY', 'NATAL_CHART');

-- AlterTable
-- `feature` defaults to COMPANION: safe and factually accurate for every existing row, since
-- Companion was the sole writer of both ai_usages and provider_logs before Sprint 12's Discovery
-- AI cost-control parity work (Sprint 12 audit §24-26/§28 — confirmed by a single-call-site search
-- for both aIUsage.create/providerLog.create prior to this migration). No historical row is
-- rewritten with a guess; the default IS the true historical value.
ALTER TABLE "ai_usages" ADD COLUMN "feature" "AIFeature" NOT NULL DEFAULT 'COMPANION';
ALTER TABLE "ai_usages" ADD COLUMN "sourceId" TEXT;

-- AlterTable
ALTER TABLE "provider_logs" ADD COLUMN "feature" "AIFeature" NOT NULL DEFAULT 'COMPANION';
ALTER TABLE "provider_logs" ADD COLUMN "sourceId" TEXT;

-- CreateIndex
CREATE INDEX "ai_usages_feature_createdAt_idx" ON "ai_usages"("feature", "createdAt");

-- CreateIndex
CREATE INDEX "provider_logs_feature_createdAt_idx" ON "provider_logs"("feature", "createdAt");
