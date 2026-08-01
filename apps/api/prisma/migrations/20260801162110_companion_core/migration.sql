-- CreateEnum
CREATE TYPE "ConversationStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ConversationRole" AS ENUM ('SYSTEM', 'USER', 'ASSISTANT');

-- CreateEnum
CREATE TYPE "AIProviderName" AS ENUM ('OPENAI', 'ANTHROPIC', 'GEMINI', 'MOCK');

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "status" "ConversationStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" "ConversationRole" NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversation_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_usages" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "conversationId" TEXT,
    "provider" "AIProviderName" NOT NULL,
    "model" TEXT NOT NULL,
    "promptTokens" INTEGER NOT NULL,
    "completionTokens" INTEGER NOT NULL,
    "totalTokens" INTEGER NOT NULL,
    "estimatedCostUsd" DECIMAL(10,6) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_usages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_logs" (
    "id" TEXT NOT NULL,
    "provider" "AIProviderName" NOT NULL,
    "model" TEXT NOT NULL,
    "latencyMs" INTEGER NOT NULL,
    "success" BOOLEAN NOT NULL,
    "errorCode" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "streamDurationMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "provider_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "conversations_userId_updatedAt_idx" ON "conversations"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "conversation_messages_conversationId_createdAt_idx" ON "conversation_messages"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "ai_usages_userId_createdAt_idx" ON "ai_usages"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "provider_logs_provider_createdAt_idx" ON "provider_logs"("provider", "createdAt");

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_messages" ADD CONSTRAINT "conversation_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_usages" ADD CONSTRAINT "ai_usages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_usages" ADD CONSTRAINT "ai_usages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Data migration: Sprint 2B replaces the Sprint 1 rule-based Companion
-- (companion_messages rows with context='COMPANION') in place with the real
-- Conversation model. Existing data is migrated, never deleted — the original
-- companion_messages rows are left untouched as a historical record, and
-- onboarding's own context='ONBOARDING' rows are completely unaffected (this
-- only ever matches context='COMPANION').
--
-- One Conversation is created per user who has at least one COMPANION-context
-- message, spanning that message range; every such message becomes a
-- ConversationMessage (USER -> USER, COMPANION -> ASSISTANT), in original order.
WITH migrated_conversations AS (
  INSERT INTO "conversations" ("id", "userId", "title", "status", "createdAt", "updatedAt")
  SELECT gen_random_uuid()::text, "userId", 'Migrated from Sprint 1 Companion', 'ACTIVE',
         MIN("createdAt"), MAX("createdAt")
  FROM "companion_messages"
  WHERE "context" = 'COMPANION'
  GROUP BY "userId"
  RETURNING "id", "userId"
)
INSERT INTO "conversation_messages" ("id", "conversationId", "role", "content", "createdAt")
SELECT gen_random_uuid()::text,
       mc."id",
       CASE cm."role" WHEN 'USER' THEN 'USER' ELSE 'ASSISTANT' END::"ConversationRole",
       cm."content",
       cm."createdAt"
FROM "companion_messages" cm
JOIN migrated_conversations mc ON mc."userId" = cm."userId"
WHERE cm."context" = 'COMPANION'
ORDER BY cm."createdAt";
