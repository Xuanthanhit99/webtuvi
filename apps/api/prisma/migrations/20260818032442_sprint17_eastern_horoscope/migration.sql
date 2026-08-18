-- CreateEnum
CREATE TYPE "EasternHoroscopeProfileStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'DELETED');

-- CreateEnum
CREATE TYPE "EasternHoroscopeProfileHistoryAction" AS ENUM ('CREATED', 'VIEWED', 'INTERPRETED', 'ARCHIVED', 'RESTORED', 'DELETED');

-- AlterEnum
ALTER TYPE "AIFeature" ADD VALUE 'EASTERN_HOROSCOPE';

-- CreateTable
CREATE TABLE "eastern_horoscope_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "EasternHoroscopeProfileStatus" NOT NULL DEFAULT 'ACTIVE',
    "birthDate" TIMESTAMP(3) NOT NULL,
    "engineVersion" TEXT NOT NULL,
    "calendarVersion" TEXT NOT NULL,
    "rulesetVersion" TEXT NOT NULL,
    "stem" TEXT NOT NULL,
    "branch" TEXT NOT NULL,
    "element" TEXT NOT NULL,
    "yinYang" TEXT NOT NULL,
    "zodiacAnimalEn" TEXT NOT NULL,
    "zodiacAnimalVi" TEXT NOT NULL,
    "interpretation" TEXT,
    "interpretationYear" INTEGER,
    "aiProvider" TEXT,
    "aiModel" TEXT,
    "promptVersion" TEXT,
    "interpretedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "eastern_horoscope_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eastern_horoscope_profile_history" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "action" "EasternHoroscopeProfileHistoryAction" NOT NULL,
    "detail" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "eastern_horoscope_profile_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "eastern_horoscope_profiles_userId_status_createdAt_idx" ON "eastern_horoscope_profiles"("userId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "eastern_horoscope_profile_history_profileId_createdAt_idx" ON "eastern_horoscope_profile_history"("profileId", "createdAt");

-- AddForeignKey
ALTER TABLE "eastern_horoscope_profiles" ADD CONSTRAINT "eastern_horoscope_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eastern_horoscope_profile_history" ADD CONSTRAINT "eastern_horoscope_profile_history_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "eastern_horoscope_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
