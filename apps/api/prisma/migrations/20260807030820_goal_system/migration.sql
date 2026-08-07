-- CreateEnum
CREATE TYPE "GoalCategory" AS ENUM ('LEARNING', 'CAREER', 'HEALTH', 'HABIT', 'RELATIONSHIP', 'FINANCIAL', 'CREATIVE', 'PERSONAL', 'OTHER');

-- CreateEnum
CREATE TYPE "GoalType" AS ENUM ('MILESTONE_BASED', 'METRIC_BASED', 'BINARY');

-- CreateEnum
CREATE TYPE "GoalDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "GoalStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'ABANDONED', 'ARCHIVED', 'DELETED');

-- CreateEnum
CREATE TYPE "GoalVisibility" AS ENUM ('PRIVATE', 'COMPANION_VISIBLE');

-- CreateEnum
CREATE TYPE "GoalMilestoneType" AS ENUM ('AUTOMATIC', 'MANUAL');

-- CreateEnum
CREATE TYPE "GoalMilestoneStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "GoalTrend" AS ENUM ('NEW', 'IMPROVING', 'STABLE', 'DECLINING');

-- CreateEnum
CREATE TYPE "GoalEvidenceSourceType" AS ENUM ('JOURNAL', 'MEMORY', 'REFLECTION', 'INSIGHT', 'REVIEW', 'ACTIVITY');

-- CreateEnum
CREATE TYPE "GoalHistoryAction" AS ENUM ('CREATED', 'UPDATED', 'PAUSED', 'RESUMED', 'COMPLETED', 'ABANDONED', 'ARCHIVED', 'RESTORED', 'DELETED', 'MILESTONE_COMPLETED', 'MILESTONE_FAILED');

-- CreateEnum
CREATE TYPE "GoalRelationshipType" AS ENUM ('PARENT_CHILD', 'RELATED');

-- CreateTable
CREATE TABLE "goals" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "GoalCategory" NOT NULL,
    "type" "GoalType" NOT NULL,
    "difficulty" "GoalDifficulty" NOT NULL DEFAULT 'MEDIUM',
    "status" "GoalStatus" NOT NULL DEFAULT 'ACTIVE',
    "previousStatus" "GoalStatus",
    "visibility" "GoalVisibility" NOT NULL DEFAULT 'PRIVATE',
    "linkedTag" TEXT NOT NULL,
    "targetValue" INTEGER,
    "targetUnit" TEXT,
    "targetDate" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goal_milestones" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "GoalMilestoneType" NOT NULL,
    "status" "GoalMilestoneStatus" NOT NULL DEFAULT 'PENDING',
    "order" INTEGER NOT NULL,
    "targetCount" INTEGER,
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goal_milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goal_progress" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "completionPercent" INTEGER NOT NULL DEFAULT 0,
    "milestoneCompletionPercent" INTEGER NOT NULL DEFAULT 0,
    "factors" JSONB,
    "trend" "GoalTrend" NOT NULL DEFAULT 'NEW',
    "previousCompletionPercent" INTEGER,
    "previousComputedAt" TIMESTAMP(3),
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "goal_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goal_evidence" (
    "id" TEXT NOT NULL,
    "goalProgressId" TEXT NOT NULL,
    "sourceType" "GoalEvidenceSourceType" NOT NULL,
    "sourceId" TEXT NOT NULL,
    "sourceTimestamp" TIMESTAMP(3) NOT NULL,
    "contribution" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "goal_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goal_history" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "action" "GoalHistoryAction" NOT NULL,
    "detail" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "goal_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goal_relationships" (
    "id" TEXT NOT NULL,
    "goalAId" TEXT NOT NULL,
    "goalBId" TEXT NOT NULL,
    "type" "GoalRelationshipType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "goal_relationships_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "goals_userId_status_createdAt_idx" ON "goals"("userId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "goals_userId_category_status_idx" ON "goals"("userId", "category", "status");

-- CreateIndex
CREATE INDEX "goals_userId_linkedTag_idx" ON "goals"("userId", "linkedTag");

-- CreateIndex
CREATE INDEX "goal_milestones_goalId_order_idx" ON "goal_milestones"("goalId", "order");

-- CreateIndex
CREATE INDEX "goal_milestones_goalId_status_idx" ON "goal_milestones"("goalId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "goal_progress_goalId_key" ON "goal_progress"("goalId");

-- CreateIndex
CREATE INDEX "goal_evidence_goalProgressId_idx" ON "goal_evidence"("goalProgressId");

-- CreateIndex
CREATE INDEX "goal_evidence_sourceType_sourceId_idx" ON "goal_evidence"("sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "goal_history_goalId_createdAt_idx" ON "goal_history"("goalId", "createdAt");

-- CreateIndex
CREATE INDEX "goal_relationships_goalAId_idx" ON "goal_relationships"("goalAId");

-- CreateIndex
CREATE INDEX "goal_relationships_goalBId_idx" ON "goal_relationships"("goalBId");

-- CreateIndex
CREATE UNIQUE INDEX "goal_relationships_goalAId_goalBId_type_key" ON "goal_relationships"("goalAId", "goalBId", "type");

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_milestones" ADD CONSTRAINT "goal_milestones_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_progress" ADD CONSTRAINT "goal_progress_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_evidence" ADD CONSTRAINT "goal_evidence_goalProgressId_fkey" FOREIGN KEY ("goalProgressId") REFERENCES "goal_progress"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_history" ADD CONSTRAINT "goal_history_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_relationships" ADD CONSTRAINT "goal_relationships_goalAId_fkey" FOREIGN KEY ("goalAId") REFERENCES "goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_relationships" ADD CONSTRAINT "goal_relationships_goalBId_fkey" FOREIGN KEY ("goalBId") REFERENCES "goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
