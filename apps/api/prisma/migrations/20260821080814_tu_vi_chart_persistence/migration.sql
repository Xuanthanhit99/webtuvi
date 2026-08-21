-- CreateEnum
CREATE TYPE "TuViChartStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'DELETED');

-- CreateEnum
CREATE TYPE "TuViChartHistoryAction" AS ENUM ('CREATED', 'VIEWED', 'INTERPRETED', 'ARCHIVED', 'RESTORED', 'DELETED');

-- CreateTable
CREATE TABLE "tu_vi_charts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "TuViChartStatus" NOT NULL DEFAULT 'ACTIVE',
    "birthDate" TIMESTAMP(3) NOT NULL,
    "birthTime" TEXT NOT NULL,
    "sex" TEXT NOT NULL,
    "engineVersion" TEXT NOT NULL,
    "calendarVersion" TEXT NOT NULL,
    "rulesetVersion" TEXT NOT NULL,
    "mainStarVersion" TEXT NOT NULL,
    "auxiliaryVersion" TEXT NOT NULL,
    "tuanTrietVersion" TEXT NOT NULL,
    "tuHoaVersion" TEXT NOT NULL,
    "lunarYear" INTEGER NOT NULL,
    "lunarMonth" INTEGER NOT NULL,
    "lunarDay" INTEGER NOT NULL,
    "isLeapMonth" BOOLEAN NOT NULL,
    "hourBranch" TEXT NOT NULL,
    "yearStem" TEXT NOT NULL,
    "yearBranch" TEXT NOT NULL,
    "menhPosition" TEXT NOT NULL,
    "thanPosition" TEXT NOT NULL,
    "cuc" TEXT NOT NULL,
    "palaceLayout" JSONB NOT NULL,
    "mainStars" JSONB NOT NULL,
    "auxiliaryStars" JSONB NOT NULL,
    "tuan" JSONB NOT NULL,
    "triet" JSONB NOT NULL,
    "transformations" JSONB NOT NULL,
    "interpretation" TEXT,
    "aiProvider" TEXT,
    "aiModel" TEXT,
    "promptVersion" TEXT,
    "interpretedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "tu_vi_charts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tu_vi_chart_history" (
    "id" TEXT NOT NULL,
    "chartId" TEXT NOT NULL,
    "action" "TuViChartHistoryAction" NOT NULL,
    "detail" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tu_vi_chart_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tu_vi_charts_userId_status_createdAt_idx" ON "tu_vi_charts"("userId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "tu_vi_chart_history_chartId_createdAt_idx" ON "tu_vi_chart_history"("chartId", "createdAt");

-- AddForeignKey
ALTER TABLE "tu_vi_charts" ADD CONSTRAINT "tu_vi_charts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tu_vi_chart_history" ADD CONSTRAINT "tu_vi_chart_history_chartId_fkey" FOREIGN KEY ("chartId") REFERENCES "tu_vi_charts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
