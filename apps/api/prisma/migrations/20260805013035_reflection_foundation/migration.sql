-- CreateEnum
CREATE TYPE "ReflectionCategory" AS ENUM ('GOAL', 'TOPIC', 'JOURNAL', 'WELLBEING', 'ALIGNMENT', 'MISMATCH', 'INACTIVITY');

-- CreateEnum
CREATE TYPE "ReflectionTrigger" AS ENUM ('REPEATED_TOPIC', 'REPEATED_GOAL', 'LONG_INACTIVITY', 'GOAL_REGRESSION', 'POSITIVE_STREAK', 'NEGATIVE_STREAK', 'REPEATED_JOURNAL_THEME', 'MEMORY_JOURNAL_ALIGNMENT', 'GOAL_ACTIVITY_MISMATCH');

-- CreateEnum
CREATE TYPE "ReflectionState" AS ENUM ('NEW', 'READY', 'DISMISSED', 'ARCHIVED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ReflectionWindow" AS ENUM ('DAY', 'WEEK', 'MONTH', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ReflectionVisibility" AS ENUM ('PRIVATE', 'COMPANION_VISIBLE');

-- CreateEnum
CREATE TYPE "ReflectionSourceType" AS ENUM ('JOURNAL', 'MEMORY', 'ACTIVITY', 'COMPANION');

-- CreateTable
CREATE TABLE "reflection_candidates" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" "ReflectionCategory" NOT NULL,
    "trigger" "ReflectionTrigger" NOT NULL,
    "state" "ReflectionState" NOT NULL DEFAULT 'READY',
    "window" "ReflectionWindow" NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "windowEnd" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "scoreFactors" JSONB,
    "groupKey" TEXT NOT NULL,
    "visibility" "ReflectionVisibility" NOT NULL DEFAULT 'COMPANION_VISIBLE',
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "dedupeKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "expiredAt" TIMESTAMP(3),

    CONSTRAINT "reflection_candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reflection_source_refs" (
    "id" TEXT NOT NULL,
    "reflectionCandidateId" TEXT NOT NULL,
    "sourceType" "ReflectionSourceType" NOT NULL,
    "sourceId" TEXT NOT NULL,
    "sourceTimestamp" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reflection_source_refs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reflection_candidates_userId_state_score_idx" ON "reflection_candidates"("userId", "state", "score");

-- CreateIndex
CREATE INDEX "reflection_candidates_userId_state_createdAt_idx" ON "reflection_candidates"("userId", "state", "createdAt");

-- CreateIndex
CREATE INDEX "reflection_candidates_userId_groupKey_idx" ON "reflection_candidates"("userId", "groupKey");

-- CreateIndex
CREATE INDEX "reflection_candidates_userId_category_state_idx" ON "reflection_candidates"("userId", "category", "state");

-- CreateIndex
CREATE UNIQUE INDEX "reflection_candidates_userId_dedupeKey_key" ON "reflection_candidates"("userId", "dedupeKey");

-- CreateIndex
CREATE INDEX "reflection_source_refs_reflectionCandidateId_idx" ON "reflection_source_refs"("reflectionCandidateId");

-- CreateIndex
CREATE INDEX "reflection_source_refs_sourceType_sourceId_idx" ON "reflection_source_refs"("sourceType", "sourceId");

-- AddForeignKey
ALTER TABLE "reflection_candidates" ADD CONSTRAINT "reflection_candidates_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reflection_source_refs" ADD CONSTRAINT "reflection_source_refs_reflectionCandidateId_fkey" FOREIGN KEY ("reflectionCandidateId") REFERENCES "reflection_candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
