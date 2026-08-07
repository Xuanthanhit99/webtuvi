-- CreateEnum
CREATE TYPE "ReviewWindow" AS ENUM ('WEEK', 'MONTH', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ReviewState" AS ENUM ('NOT_READY', 'READY', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ReviewSectionType" AS ENUM ('HIGHLIGHTS', 'CHANGES', 'ACHIEVEMENTS', 'CHALLENGES');

-- CreateEnum
CREATE TYPE "ReviewEvidenceSourceType" AS ENUM ('INSIGHT', 'REFLECTION', 'JOURNAL', 'MEMORY');

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "window" "ReviewWindow" NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "windowEnd" TIMESTAMP(3) NOT NULL,
    "state" "ReviewState" NOT NULL DEFAULT 'NOT_READY',
    "overview" TEXT NOT NULL,
    "statistics" JSONB NOT NULL,
    "dedupeKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_sections" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "type" "ReviewSectionType" NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_evidence" (
    "id" TEXT NOT NULL,
    "reviewSectionId" TEXT NOT NULL,
    "sourceType" "ReviewEvidenceSourceType" NOT NULL,
    "sourceId" TEXT NOT NULL,
    "sourceTimestamp" TIMESTAMP(3) NOT NULL,
    "contribution" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reviews_userId_window_windowStart_idx" ON "reviews"("userId", "window", "windowStart");

-- CreateIndex
CREATE INDEX "reviews_userId_state_idx" ON "reviews"("userId", "state");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_userId_dedupeKey_key" ON "reviews"("userId", "dedupeKey");

-- CreateIndex
CREATE INDEX "review_sections_reviewId_idx" ON "review_sections"("reviewId");

-- CreateIndex
CREATE UNIQUE INDEX "review_sections_reviewId_type_key" ON "review_sections"("reviewId", "type");

-- CreateIndex
CREATE INDEX "review_evidence_reviewSectionId_idx" ON "review_evidence"("reviewSectionId");

-- CreateIndex
CREATE INDEX "review_evidence_sourceType_sourceId_idx" ON "review_evidence"("sourceType", "sourceId");

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_sections" ADD CONSTRAINT "review_sections_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_evidence" ADD CONSTRAINT "review_evidence_reviewSectionId_fkey" FOREIGN KEY ("reviewSectionId") REFERENCES "review_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
