-- CreateEnum
CREATE TYPE "NatalChartStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'DELETED');

-- CreateEnum
CREATE TYPE "NatalChartVisibility" AS ENUM ('PRIVATE', 'COMPANION_VISIBLE');

-- CreateEnum
CREATE TYPE "NatalChartHistoryAction" AS ENUM ('CREATED', 'VIEWED', 'INTERPRETED', 'ARCHIVED', 'RESTORED', 'DELETED');

-- CreateEnum
CREATE TYPE "NatalZodiacSign" AS ENUM ('ARIES', 'TAURUS', 'GEMINI', 'CANCER', 'LEO', 'VIRGO', 'LIBRA', 'SCORPIO', 'SAGITTARIUS', 'CAPRICORN', 'AQUARIUS', 'PISCES');

-- CreateEnum
CREATE TYPE "NatalChartPoint" AS ENUM ('SUN', 'MOON', 'MERCURY', 'VENUS', 'MARS', 'JUPITER', 'SATURN', 'URANUS', 'NEPTUNE', 'PLUTO', 'ASCENDANT', 'MIDHEAVEN');

-- CreateEnum
CREATE TYPE "NatalAspectType" AS ENUM ('CONJUNCTION', 'OPPOSITION', 'TRINE', 'SQUARE', 'SEXTILE');

-- CreateTable
CREATE TABLE "natal_charts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "NatalChartStatus" NOT NULL DEFAULT 'ACTIVE',
    "visibility" "NatalChartVisibility" NOT NULL DEFAULT 'PRIVATE',
    "birthDate" TIMESTAMP(3) NOT NULL,
    "birthTime" TEXT,
    "birthTimeKnown" BOOLEAN NOT NULL,
    "birthPlaceLabel" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "timezone" TEXT NOT NULL,
    "zodiacMode" TEXT NOT NULL DEFAULT 'tropical',
    "houseSystem" TEXT NOT NULL DEFAULT 'placidus',
    "housesAvailable" BOOLEAN NOT NULL DEFAULT true,
    "calculationVersion" TEXT NOT NULL,
    "engineVersion" TEXT NOT NULL,
    "ascendantLongitude" DOUBLE PRECISION,
    "ascendantSign" "NatalZodiacSign",
    "ascendantDegreeInSign" DOUBLE PRECISION,
    "midheavenLongitude" DOUBLE PRECISION,
    "midheavenSign" "NatalZodiacSign",
    "midheavenDegreeInSign" DOUBLE PRECISION,
    "interpretation" JSONB,
    "aiProvider" TEXT,
    "aiModel" TEXT,
    "promptVersion" TEXT,
    "interpretedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "natal_charts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "natal_placements" (
    "id" TEXT NOT NULL,
    "chartId" TEXT NOT NULL,
    "body" "NatalChartPoint" NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "sign" "NatalZodiacSign" NOT NULL,
    "degreeInSign" DOUBLE PRECISION NOT NULL,
    "house" INTEGER,
    "retrograde" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL,

    CONSTRAINT "natal_placements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "natal_houses" (
    "id" TEXT NOT NULL,
    "chartId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "cuspLongitude" DOUBLE PRECISION NOT NULL,
    "sign" "NatalZodiacSign" NOT NULL,

    CONSTRAINT "natal_houses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "natal_aspects" (
    "id" TEXT NOT NULL,
    "chartId" TEXT NOT NULL,
    "pointA" "NatalChartPoint" NOT NULL,
    "pointB" "NatalChartPoint" NOT NULL,
    "type" "NatalAspectType" NOT NULL,
    "orb" DOUBLE PRECISION NOT NULL,
    "angle" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "natal_aspects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "natal_chart_history" (
    "id" TEXT NOT NULL,
    "chartId" TEXT NOT NULL,
    "action" "NatalChartHistoryAction" NOT NULL,
    "detail" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "natal_chart_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "natal_charts_userId_status_createdAt_idx" ON "natal_charts"("userId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "natal_placements_chartId_idx" ON "natal_placements"("chartId");

-- CreateIndex
CREATE UNIQUE INDEX "natal_placements_chartId_body_key" ON "natal_placements"("chartId", "body");

-- CreateIndex
CREATE INDEX "natal_houses_chartId_idx" ON "natal_houses"("chartId");

-- CreateIndex
CREATE UNIQUE INDEX "natal_houses_chartId_number_key" ON "natal_houses"("chartId", "number");

-- CreateIndex
CREATE INDEX "natal_aspects_chartId_idx" ON "natal_aspects"("chartId");

-- CreateIndex
CREATE INDEX "natal_chart_history_chartId_createdAt_idx" ON "natal_chart_history"("chartId", "createdAt");

-- AddForeignKey
ALTER TABLE "natal_charts" ADD CONSTRAINT "natal_charts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "natal_placements" ADD CONSTRAINT "natal_placements_chartId_fkey" FOREIGN KEY ("chartId") REFERENCES "natal_charts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "natal_houses" ADD CONSTRAINT "natal_houses_chartId_fkey" FOREIGN KEY ("chartId") REFERENCES "natal_charts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "natal_aspects" ADD CONSTRAINT "natal_aspects_chartId_fkey" FOREIGN KEY ("chartId") REFERENCES "natal_charts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "natal_chart_history" ADD CONSTRAINT "natal_chart_history_chartId_fkey" FOREIGN KEY ("chartId") REFERENCES "natal_charts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
