-- CreateEnum
CREATE TYPE "NatalChartReadingStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'DELETED');

-- CreateEnum
CREATE TYPE "NatalChartReadingVisibility" AS ENUM ('PRIVATE', 'COMPANION_VISIBLE');

-- CreateEnum
CREATE TYPE "NatalChartReadingHistoryAction" AS ENUM ('CREATED', 'VIEWED', 'INTERPRETED', 'ARCHIVED', 'RESTORED', 'DELETED');

-- CreateEnum
CREATE TYPE "NatalChartBody" AS ENUM ('SUN', 'MOON', 'MERCURY', 'VENUS', 'MARS', 'JUPITER', 'SATURN', 'URANUS', 'NEPTUNE', 'PLUTO');

-- CreateEnum
CREATE TYPE "NatalChartAngleKind" AS ENUM ('ASCENDANT', 'MIDHEAVEN');

-- CreateEnum
CREATE TYPE "NatalChartAspectType" AS ENUM ('CONJUNCTION', 'OPPOSITION', 'TRINE', 'SQUARE', 'SEXTILE');

-- CreateTable
CREATE TABLE "natal_chart_readings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "NatalChartReadingStatus" NOT NULL DEFAULT 'ACTIVE',
    "visibility" "NatalChartReadingVisibility" NOT NULL DEFAULT 'PRIVATE',
    "birthDateInput" TEXT NOT NULL,
    "birthTimeInput" TEXT,
    "birthTimeKnown" BOOLEAN NOT NULL DEFAULT false,
    "birthPlaceInput" TEXT NOT NULL,
    "normalizedLatitude" DOUBLE PRECISION NOT NULL,
    "normalizedLongitude" DOUBLE PRECISION NOT NULL,
    "normalizedTimezone" TEXT NOT NULL,
    "normalizedPlaceLabel" TEXT NOT NULL,
    "calculationVersion" TEXT NOT NULL,
    "engineVersion" TEXT NOT NULL,
    "houseSystem" TEXT NOT NULL,
    "zodiacMode" TEXT NOT NULL,
    "ascendantAvailable" BOOLEAN NOT NULL DEFAULT false,
    "interpretation" JSONB,
    "aiProvider" TEXT,
    "aiModel" TEXT,
    "promptVersion" TEXT,
    "interpretedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "natal_chart_readings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "natal_chart_placements" (
    "id" TEXT NOT NULL,
    "readingId" TEXT NOT NULL,
    "body" "NatalChartBody" NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "sign" TEXT NOT NULL,
    "degreeInSign" DOUBLE PRECISION NOT NULL,
    "houseNumber" INTEGER,
    "retrograde" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "natal_chart_placements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "natal_chart_angles" (
    "id" TEXT NOT NULL,
    "readingId" TEXT NOT NULL,
    "kind" "NatalChartAngleKind" NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "sign" TEXT NOT NULL,
    "degreeInSign" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "natal_chart_angles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "natal_chart_houses" (
    "id" TEXT NOT NULL,
    "readingId" TEXT NOT NULL,
    "houseNumber" INTEGER NOT NULL,
    "cuspLongitude" DOUBLE PRECISION NOT NULL,
    "sign" TEXT NOT NULL,

    CONSTRAINT "natal_chart_houses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "natal_chart_aspects" (
    "id" TEXT NOT NULL,
    "readingId" TEXT NOT NULL,
    "bodyOne" TEXT NOT NULL,
    "bodyTwo" TEXT NOT NULL,
    "aspectType" "NatalChartAspectType" NOT NULL,
    "orb" DOUBLE PRECISION NOT NULL,
    "orbAllowed" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "natal_chart_aspects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "natal_chart_reading_history" (
    "id" TEXT NOT NULL,
    "readingId" TEXT NOT NULL,
    "action" "NatalChartReadingHistoryAction" NOT NULL,
    "detail" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "natal_chart_reading_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "natal_chart_readings_userId_status_createdAt_idx" ON "natal_chart_readings"("userId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "natal_chart_placements_readingId_idx" ON "natal_chart_placements"("readingId");

-- CreateIndex
CREATE UNIQUE INDEX "natal_chart_placements_readingId_body_key" ON "natal_chart_placements"("readingId", "body");

-- CreateIndex
CREATE INDEX "natal_chart_angles_readingId_idx" ON "natal_chart_angles"("readingId");

-- CreateIndex
CREATE UNIQUE INDEX "natal_chart_angles_readingId_kind_key" ON "natal_chart_angles"("readingId", "kind");

-- CreateIndex
CREATE INDEX "natal_chart_houses_readingId_idx" ON "natal_chart_houses"("readingId");

-- CreateIndex
CREATE UNIQUE INDEX "natal_chart_houses_readingId_houseNumber_key" ON "natal_chart_houses"("readingId", "houseNumber");

-- CreateIndex
CREATE INDEX "natal_chart_aspects_readingId_idx" ON "natal_chart_aspects"("readingId");

-- CreateIndex
CREATE INDEX "natal_chart_reading_history_readingId_createdAt_idx" ON "natal_chart_reading_history"("readingId", "createdAt");

-- AddForeignKey
ALTER TABLE "natal_chart_readings" ADD CONSTRAINT "natal_chart_readings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "natal_chart_placements" ADD CONSTRAINT "natal_chart_placements_readingId_fkey" FOREIGN KEY ("readingId") REFERENCES "natal_chart_readings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "natal_chart_angles" ADD CONSTRAINT "natal_chart_angles_readingId_fkey" FOREIGN KEY ("readingId") REFERENCES "natal_chart_readings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "natal_chart_houses" ADD CONSTRAINT "natal_chart_houses_readingId_fkey" FOREIGN KEY ("readingId") REFERENCES "natal_chart_readings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "natal_chart_aspects" ADD CONSTRAINT "natal_chart_aspects_readingId_fkey" FOREIGN KEY ("readingId") REFERENCES "natal_chart_readings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "natal_chart_reading_history" ADD CONSTRAINT "natal_chart_reading_history_readingId_fkey" FOREIGN KEY ("readingId") REFERENCES "natal_chart_readings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
