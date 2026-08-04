-- Sprint 3B — Memory Intelligence.
-- Handwritten (no live database was reachable this session to generate this via
-- `prisma migrate dev` — see docs/progress/sprint-3b-progress.md "Environment note"),
-- following the same hand-authored-migration precedent as
-- 20260803064730_memory_foundation. `prisma validate`/`prisma generate` (schema-only,
-- no DB required) both pass against this migration's resulting schema; `prisma migrate
-- deploy`/`status` against a real database is a disclosed runtime-unverified item.

-- AlterTable: new deterministic-scoring columns on "memories". Backfill sets every
-- existing ACCEPTED row's importanceScore from a source-type-only baseline (pinned=false,
-- referencedCount=0 for all pre-existing rows) rather than leaving it at a misleading 0 —
-- a full recompute (all documented factors) still happens the first time
-- ImportanceScoringService runs for that memory.
ALTER TABLE "memories" ADD COLUMN "importanceScore" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "memories" ADD COLUMN "importanceFactors" JSONB;
ALTER TABLE "memories" ADD COLUMN "pinned" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "memories" ADD COLUMN "referencedCount" INTEGER NOT NULL DEFAULT 0;

UPDATE "memories"
SET "importanceScore" = CASE "sourceType"
  WHEN 'USER_EXPLICIT' THEN 30
  WHEN 'COMPANION' THEN 20
  WHEN 'ONBOARDING' THEN 20
  WHEN 'MIGRATED_LEGACY' THEN 10
  ELSE 10
END,
"importanceFactors" = jsonb_build_object('backfill', true, 'sourceType', "sourceType")
WHERE "status" = 'ACCEPTED';

-- CreateIndex
CREATE INDEX "memories_userId_status_importanceScore_idx" ON "memories"("userId", "status", "importanceScore");

-- CreateEnum
CREATE TYPE "MemoryDuplicateMatchType" AS ENUM ('EXACT', 'NORMALIZED', 'STRUCTURED', 'TYPE_SPECIFIC');

-- CreateEnum
CREATE TYPE "MemoryDuplicateStatus" AS ENUM ('PENDING', 'DISMISSED', 'MERGED');

-- CreateEnum
CREATE TYPE "MemoryConflictStatus" AS ENUM ('CONFLICT', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "MemoryMergeSuggestionStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateTable
CREATE TABLE "memory_duplicates" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "memoryAId" TEXT NOT NULL,
    "memoryBId" TEXT NOT NULL,
    "matchType" "MemoryDuplicateMatchType" NOT NULL,
    "similarity" INTEGER NOT NULL,
    "status" "MemoryDuplicateStatus" NOT NULL DEFAULT 'PENDING',
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "memory_duplicates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memory_conflicts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "memoryAId" TEXT NOT NULL,
    "memoryBId" TEXT NOT NULL,
    "status" "MemoryConflictStatus" NOT NULL DEFAULT 'CONFLICT',
    "reason" TEXT NOT NULL,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "memory_conflicts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memory_merge_suggestions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "primaryMemoryId" TEXT NOT NULL,
    "duplicateMemoryId" TEXT NOT NULL,
    "confidence" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "MemoryMergeSuggestionStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "memory_merge_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memory_retrieval_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "candidateCount" INTEGER NOT NULL,
    "retrievedCount" INTEGER NOT NULL,
    "tokenBudget" INTEGER NOT NULL,
    "tokenUsed" INTEGER NOT NULL,
    "latencyMs" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "memory_retrieval_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "memory_duplicates_memoryAId_memoryBId_key" ON "memory_duplicates"("memoryAId", "memoryBId");

-- CreateIndex
CREATE INDEX "memory_duplicates_userId_status_idx" ON "memory_duplicates"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "memory_conflicts_memoryAId_memoryBId_key" ON "memory_conflicts"("memoryAId", "memoryBId");

-- CreateIndex
CREATE INDEX "memory_conflicts_userId_status_idx" ON "memory_conflicts"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "memory_merge_suggestions_primaryMemoryId_duplicateMemoryId_key" ON "memory_merge_suggestions"("primaryMemoryId", "duplicateMemoryId");

-- CreateIndex
CREATE INDEX "memory_merge_suggestions_userId_status_idx" ON "memory_merge_suggestions"("userId", "status");

-- CreateIndex
CREATE INDEX "memory_retrieval_logs_userId_createdAt_idx" ON "memory_retrieval_logs"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "memory_duplicates" ADD CONSTRAINT "memory_duplicates_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memory_conflicts" ADD CONSTRAINT "memory_conflicts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memory_merge_suggestions" ADD CONSTRAINT "memory_merge_suggestions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memory_retrieval_logs" ADD CONSTRAINT "memory_retrieval_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
