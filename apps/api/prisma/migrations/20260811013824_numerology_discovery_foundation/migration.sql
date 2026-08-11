-- CreateEnum
CREATE TYPE "NumerologyReadingStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'DELETED');

-- CreateEnum
CREATE TYPE "NumerologyReadingVisibility" AS ENUM ('PRIVATE', 'COMPANION_VISIBLE');

-- CreateEnum
CREATE TYPE "NumerologyReadingHistoryAction" AS ENUM ('CREATED', 'VIEWED', 'INTERPRETED', 'ARCHIVED', 'RESTORED', 'DELETED');

-- CreateEnum
CREATE TYPE "NumerologyValueType" AS ENUM ('LIFE_PATH', 'EXPRESSION', 'SOUL_URGE', 'PERSONALITY', 'BIRTHDAY', 'PERSONAL_YEAR');

-- CreateTable
CREATE TABLE "numerology_readings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "NumerologyReadingStatus" NOT NULL DEFAULT 'ACTIVE',
    "visibility" "NumerologyReadingVisibility" NOT NULL DEFAULT 'PRIVATE',
    "birthNameInput" TEXT NOT NULL,
    "normalizedBirthName" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "calculationVersion" TEXT NOT NULL,
    "normalizationVersion" TEXT NOT NULL,
    "interpretation" TEXT,
    "aiProvider" TEXT,
    "aiModel" TEXT,
    "promptVersion" TEXT,
    "interpretedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "numerology_readings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "numerology_values" (
    "id" TEXT NOT NULL,
    "readingId" TEXT NOT NULL,
    "type" "NumerologyValueType" NOT NULL,
    "value" INTEGER NOT NULL,
    "isMasterNumber" BOOLEAN NOT NULL DEFAULT false,
    "breakdown" JSONB NOT NULL,
    "appliesToYear" INTEGER,
    "order" INTEGER NOT NULL,

    CONSTRAINT "numerology_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "numerology_reading_history" (
    "id" TEXT NOT NULL,
    "readingId" TEXT NOT NULL,
    "action" "NumerologyReadingHistoryAction" NOT NULL,
    "detail" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "numerology_reading_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "numerology_readings_userId_status_createdAt_idx" ON "numerology_readings"("userId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "numerology_values_readingId_idx" ON "numerology_values"("readingId");

-- CreateIndex
CREATE UNIQUE INDEX "numerology_values_readingId_type_key" ON "numerology_values"("readingId", "type");

-- CreateIndex
CREATE INDEX "numerology_reading_history_readingId_createdAt_idx" ON "numerology_reading_history"("readingId", "createdAt");

-- AddForeignKey
ALTER TABLE "numerology_readings" ADD CONSTRAINT "numerology_readings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "numerology_values" ADD CONSTRAINT "numerology_values_readingId_fkey" FOREIGN KEY ("readingId") REFERENCES "numerology_readings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "numerology_reading_history" ADD CONSTRAINT "numerology_reading_history_readingId_fkey" FOREIGN KEY ("readingId") REFERENCES "numerology_readings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
