-- CreateEnum
CREATE TYPE "InsightCategory" AS ENUM ('GOAL', 'TOPIC', 'JOURNAL', 'WELLBEING', 'ALIGNMENT', 'MISMATCH', 'INACTIVITY');

-- CreateEnum
CREATE TYPE "InsightStatus" AS ENUM ('NOT_READY', 'READY', 'INSUFFICIENT_EVIDENCE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "InsightWindow" AS ENUM ('DAY', 'WEEK', 'MONTH', 'CUSTOM');

-- CreateEnum
CREATE TYPE "InsightRelationshipType" AS ENUM ('SUPPORTS', 'CONTRADICTS', 'CONTINUES', 'REPEATS', 'IMPROVES', 'REGRESSES', 'STAGNATES');

-- CreateTable
CREATE TABLE "insight_candidates" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" "InsightCategory" NOT NULL,
    "status" "InsightStatus" NOT NULL DEFAULT 'NOT_READY',
    "window" "InsightWindow" NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "windowEnd" TIMESTAMP(3) NOT NULL,
    "ruleExplanation" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "priorityFactors" JSONB,
    "dedupeKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "insight_candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insight_evidence" (
    "id" TEXT NOT NULL,
    "insightCandidateId" TEXT NOT NULL,
    "reflectionCandidateId" TEXT NOT NULL,
    "contribution" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "insight_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insight_relationships" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "insightCandidateId" TEXT,
    "reflectionAId" TEXT NOT NULL,
    "reflectionBId" TEXT NOT NULL,
    "type" "InsightRelationshipType" NOT NULL,
    "reason" TEXT NOT NULL,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "insight_relationships_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "insight_candidates_userId_status_priority_idx" ON "insight_candidates"("userId", "status", "priority");

-- CreateIndex
CREATE INDEX "insight_candidates_userId_category_status_idx" ON "insight_candidates"("userId", "category", "status");

-- CreateIndex
CREATE UNIQUE INDEX "insight_candidates_userId_dedupeKey_key" ON "insight_candidates"("userId", "dedupeKey");

-- CreateIndex
CREATE INDEX "insight_evidence_insightCandidateId_idx" ON "insight_evidence"("insightCandidateId");

-- CreateIndex
CREATE INDEX "insight_evidence_reflectionCandidateId_idx" ON "insight_evidence"("reflectionCandidateId");

-- CreateIndex
CREATE UNIQUE INDEX "insight_evidence_insightCandidateId_reflectionCandidateId_key" ON "insight_evidence"("insightCandidateId", "reflectionCandidateId");

-- CreateIndex
CREATE INDEX "insight_relationships_userId_idx" ON "insight_relationships"("userId");

-- CreateIndex
CREATE INDEX "insight_relationships_insightCandidateId_idx" ON "insight_relationships"("insightCandidateId");

-- CreateIndex
CREATE UNIQUE INDEX "insight_relationships_reflectionAId_reflectionBId_key" ON "insight_relationships"("reflectionAId", "reflectionBId");

-- AddForeignKey
ALTER TABLE "insight_candidates" ADD CONSTRAINT "insight_candidates_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insight_evidence" ADD CONSTRAINT "insight_evidence_insightCandidateId_fkey" FOREIGN KEY ("insightCandidateId") REFERENCES "insight_candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insight_evidence" ADD CONSTRAINT "insight_evidence_reflectionCandidateId_fkey" FOREIGN KEY ("reflectionCandidateId") REFERENCES "reflection_candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insight_relationships" ADD CONSTRAINT "insight_relationships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insight_relationships" ADD CONSTRAINT "insight_relationships_insightCandidateId_fkey" FOREIGN KEY ("insightCandidateId") REFERENCES "insight_candidates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insight_relationships" ADD CONSTRAINT "insight_relationships_reflectionAId_fkey" FOREIGN KEY ("reflectionAId") REFERENCES "reflection_candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insight_relationships" ADD CONSTRAINT "insight_relationships_reflectionBId_fkey" FOREIGN KEY ("reflectionBId") REFERENCES "reflection_candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
