-- CreateEnum
CREATE TYPE "JournalState" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED', 'DELETED');

-- CreateEnum
CREATE TYPE "JournalVisibility" AS ENUM ('PRIVATE', 'SHARED');

-- CreateEnum
CREATE TYPE "JournalMood" AS ENUM ('GREAT', 'GOOD', 'OKAY', 'LOW', 'DIFFICULT');

-- CreateEnum
CREATE TYPE "JournalSourceType" AS ENUM ('USER', 'COMPANION_SUGGESTED');

-- AlterTable
ALTER TABLE "user_preferences" ADD COLUMN     "journalSuggestionsEnabled" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "journal_entries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "state" "JournalState" NOT NULL DEFAULT 'DRAFT',
    "previousState" "JournalState",
    "visibility" "JournalVisibility" NOT NULL DEFAULT 'PRIVATE',
    "mood" "JournalMood",
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "wordCount" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "sourceType" "JournalSourceType" NOT NULL DEFAULT 'USER',
    "sourceConversationId" TEXT,
    "sourceMessageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "journal_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_revisions" (
    "id" TEXT NOT NULL,
    "journalId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "mood" "JournalMood",
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "changeReason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "journal_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "journal_entries_userId_state_createdAt_idx" ON "journal_entries"("userId", "state", "createdAt");

-- CreateIndex
CREATE INDEX "journal_entries_userId_state_pinned_createdAt_idx" ON "journal_entries"("userId", "state", "pinned", "createdAt");

-- CreateIndex
CREATE INDEX "journal_entries_userId_createdAt_idx" ON "journal_entries"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "journal_revisions_journalId_createdAt_idx" ON "journal_revisions"("journalId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "journal_revisions_journalId_version_key" ON "journal_revisions"("journalId", "version");

-- AddForeignKey
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_revisions" ADD CONSTRAINT "journal_revisions_journalId_fkey" FOREIGN KEY ("journalId") REFERENCES "journal_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
