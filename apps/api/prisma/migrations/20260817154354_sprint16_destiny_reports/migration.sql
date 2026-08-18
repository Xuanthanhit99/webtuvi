-- CreateEnum
CREATE TYPE "DestinyReportStatus" AS ENUM ('GENERATING', 'READY', 'FAILED');

-- CreateEnum
CREATE TYPE "DestinyReportFailureReason" AS ENUM ('PROVIDER_UNAVAILABLE', 'BUDGET_EXCEEDED', 'VALIDATION_FAILED', 'SAFETY_REFUSED', 'INTERNAL_ERROR');

-- AlterEnum
ALTER TYPE "AIFeature" ADD VALUE 'REPORTS';

-- CreateTable
CREATE TABLE "destiny_reports" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "DestinyReportStatus" NOT NULL DEFAULT 'GENERATING',
    "natalChartId" TEXT NOT NULL,
    "numerologyReadingId" TEXT NOT NULL,
    "reportSchemaVersion" TEXT NOT NULL,
    "reportTemplateVersion" TEXT NOT NULL,
    "aiPromptVersion" TEXT NOT NULL,
    "sourceSnapshot" JSONB NOT NULL,
    "structuredResult" JSONB,
    "aiProvider" "AIProviderName",
    "aiModel" TEXT,
    "failureReason" "DestinyReportFailureReason",
    "generationStartedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "destiny_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "destiny_reports_userId_status_createdAt_idx" ON "destiny_reports"("userId", "status", "createdAt");

-- AddForeignKey
ALTER TABLE "destiny_reports" ADD CONSTRAINT "destiny_reports_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

