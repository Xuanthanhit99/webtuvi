-- CreateEnum
CREATE TYPE "TarotArcana" AS ENUM ('MAJOR', 'MINOR');

-- CreateEnum
CREATE TYPE "TarotSuit" AS ENUM ('WANDS', 'CUPS', 'SWORDS', 'PENTACLES');

-- CreateEnum
CREATE TYPE "TarotReadingType" AS ENUM ('DAILY_DRAW', 'SINGLE_CARD', 'THREE_CARD');

-- CreateEnum
CREATE TYPE "TarotReadingStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'DELETED');

-- CreateEnum
CREATE TYPE "TarotReadingVisibility" AS ENUM ('PRIVATE', 'COMPANION_VISIBLE');

-- CreateEnum
CREATE TYPE "TarotReadingHistoryAction" AS ENUM ('CREATED', 'VIEWED', 'INTERPRETED', 'ARCHIVED', 'RESTORED', 'DELETED');

-- CreateTable
CREATE TABLE "tarot_cards" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "arcana" "TarotArcana" NOT NULL,
    "suit" "TarotSuit",
    "number" INTEGER NOT NULL,
    "uprightKeywords" TEXT[],
    "uprightMeaning" TEXT NOT NULL,
    "reversedKeywords" TEXT[],
    "reversedMeaning" TEXT NOT NULL,
    "element" TEXT,
    "astrological" TEXT,
    "categories" TEXT[],
    "imageSlug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tarot_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tarot_spreads" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cardCount" INTEGER NOT NULL,
    "positions" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tarot_spreads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tarot_readings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "TarotReadingType" NOT NULL,
    "spreadId" TEXT NOT NULL,
    "status" "TarotReadingStatus" NOT NULL DEFAULT 'ACTIVE',
    "visibility" "TarotReadingVisibility" NOT NULL DEFAULT 'PRIVATE',
    "question" TEXT,
    "interpretation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "tarot_readings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tarot_reading_cards" (
    "id" TEXT NOT NULL,
    "readingId" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "positionLabel" TEXT,
    "isReversed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "tarot_reading_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tarot_reading_sessions" (
    "id" TEXT NOT NULL,
    "readingId" TEXT NOT NULL,
    "seed" TEXT NOT NULL,
    "algorithm" TEXT NOT NULL,
    "shuffledCardIds" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tarot_reading_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tarot_reading_history" (
    "id" TEXT NOT NULL,
    "readingId" TEXT NOT NULL,
    "action" "TarotReadingHistoryAction" NOT NULL,
    "detail" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tarot_reading_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tarot_cards_slug_key" ON "tarot_cards"("slug");

-- CreateIndex
CREATE INDEX "tarot_cards_arcana_idx" ON "tarot_cards"("arcana");

-- CreateIndex
CREATE INDEX "tarot_cards_suit_idx" ON "tarot_cards"("suit");

-- CreateIndex
CREATE UNIQUE INDEX "tarot_spreads_slug_key" ON "tarot_spreads"("slug");

-- CreateIndex
CREATE INDEX "tarot_readings_userId_status_createdAt_idx" ON "tarot_readings"("userId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "tarot_readings_userId_type_createdAt_idx" ON "tarot_readings"("userId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "tarot_reading_cards_readingId_idx" ON "tarot_reading_cards"("readingId");

-- CreateIndex
CREATE INDEX "tarot_reading_cards_cardId_idx" ON "tarot_reading_cards"("cardId");

-- CreateIndex
CREATE UNIQUE INDEX "tarot_reading_cards_readingId_position_key" ON "tarot_reading_cards"("readingId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "tarot_reading_sessions_readingId_key" ON "tarot_reading_sessions"("readingId");

-- CreateIndex
CREATE INDEX "tarot_reading_history_readingId_createdAt_idx" ON "tarot_reading_history"("readingId", "createdAt");

-- AddForeignKey
ALTER TABLE "tarot_readings" ADD CONSTRAINT "tarot_readings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarot_readings" ADD CONSTRAINT "tarot_readings_spreadId_fkey" FOREIGN KEY ("spreadId") REFERENCES "tarot_spreads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarot_reading_cards" ADD CONSTRAINT "tarot_reading_cards_readingId_fkey" FOREIGN KEY ("readingId") REFERENCES "tarot_readings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarot_reading_cards" ADD CONSTRAINT "tarot_reading_cards_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "tarot_cards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarot_reading_sessions" ADD CONSTRAINT "tarot_reading_sessions_readingId_fkey" FOREIGN KEY ("readingId") REFERENCES "tarot_readings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarot_reading_history" ADD CONSTRAINT "tarot_reading_history_readingId_fkey" FOREIGN KEY ("readingId") REFERENCES "tarot_readings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
