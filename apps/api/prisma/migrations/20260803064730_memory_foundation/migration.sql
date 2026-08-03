-- CreateEnum
CREATE TYPE "MemoryType" AS ENUM ('IDENTITY', 'PREFERENCE', 'GOAL', 'RELATIONSHIP', 'HABIT', 'ROUTINE', 'ACHIEVEMENT', 'CHALLENGE', 'EMOTION', 'IMPORTANT_EVENT', 'DECISION', 'INTEREST', 'WORK', 'STUDY', 'PET', 'LOCATION_PREFERENCE', 'HEALTH', 'CUSTOM');

-- CreateEnum
CREATE TYPE "MemoryStatus" AS ENUM ('CANDIDATE', 'PENDING_CONSENT', 'ACCEPTED', 'REJECTED', 'ARCHIVED', 'EXPIRED', 'DELETED');

-- CreateEnum
CREATE TYPE "MemoryConsentMode" AS ENUM ('ASK_EVERY_TIME', 'ALLOW_SELECTED', 'ALLOW_TYPE', 'DENY_TYPE', 'DISABLED');

-- CreateEnum
CREATE TYPE "MemoryVisibility" AS ENUM ('PRIVATE', 'COMPANION_ALLOWED');

-- CreateEnum
CREATE TYPE "MemorySourceType" AS ENUM ('ONBOARDING', 'COMPANION', 'USER_EXPLICIT', 'MIGRATED_LEGACY', 'SYSTEM_TEST');

-- CreateEnum
CREATE TYPE "MemoryCandidateStatus" AS ENUM ('CANDIDATE', 'PENDING_CONSENT', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "MemoryAuditAction" AS ENUM ('CREATED', 'ACCEPTED', 'REJECTED', 'UPDATED', 'ARCHIVED', 'RESTORED', 'DELETED', 'CONSENT_CHANGED', 'VIEWED', 'EXPORTED');

-- CreateEnum
CREATE TYPE "MemoryActorType" AS ENUM ('USER', 'SYSTEM', 'COMPANION');

-- CreateTable
CREATE TABLE "memory_consent_settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mode" "MemoryConsentMode" NOT NULL DEFAULT 'ASK_EVERY_TIME',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "memory_consent_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memory_type_consents" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "MemoryType" NOT NULL,
    "mode" "MemoryConsentMode" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "memory_type_consents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memory_candidates" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "proposedType" "MemoryType" NOT NULL,
    "proposedTitle" TEXT NOT NULL,
    "proposedSummary" TEXT NOT NULL,
    "structuredPayload" JSONB,
    "sourceType" "MemorySourceType" NOT NULL,
    "sourceConversationId" TEXT,
    "sourceMessageId" TEXT,
    "reason" TEXT,
    "status" "MemoryCandidateStatus" NOT NULL DEFAULT 'CANDIDATE',
    "resultingMemoryId" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "memory_candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memories" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "MemoryType" NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "structuredPayload" JSONB,
    "status" "MemoryStatus" NOT NULL DEFAULT 'ACCEPTED',
    "consentState" "MemoryConsentMode" NOT NULL DEFAULT 'ALLOW_SELECTED',
    "visibility" "MemoryVisibility" NOT NULL DEFAULT 'PRIVATE',
    "sourceType" "MemorySourceType" NOT NULL,
    "sourceConversationId" TEXT,
    "sourceMessageId" TEXT,
    "expiresAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "lastReferencedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "memories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memory_versions" (
    "id" TEXT NOT NULL,
    "memoryId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "type" "MemoryType" NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "structuredPayload" JSONB,
    "visibility" "MemoryVisibility" NOT NULL,
    "changeReason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "memory_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memory_audits" (
    "id" TEXT NOT NULL,
    "memoryId" TEXT,
    "userId" TEXT NOT NULL,
    "actorType" "MemoryActorType" NOT NULL DEFAULT 'USER',
    "action" "MemoryAuditAction" NOT NULL,
    "requestId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "memory_audits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "memory_consent_settings_userId_key" ON "memory_consent_settings"("userId");

-- CreateIndex
CREATE INDEX "memory_type_consents_userId_idx" ON "memory_type_consents"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "memory_type_consents_userId_type_key" ON "memory_type_consents"("userId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "memory_candidates_resultingMemoryId_key" ON "memory_candidates"("resultingMemoryId");

-- CreateIndex
CREATE INDEX "memory_candidates_userId_status_createdAt_idx" ON "memory_candidates"("userId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "memories_userId_status_createdAt_idx" ON "memories"("userId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "memories_userId_type_createdAt_idx" ON "memories"("userId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "memories_userId_createdAt_idx" ON "memories"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "memory_versions_memoryId_createdAt_idx" ON "memory_versions"("memoryId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "memory_versions_memoryId_version_key" ON "memory_versions"("memoryId", "version");

-- CreateIndex
CREATE INDEX "memory_audits_userId_createdAt_idx" ON "memory_audits"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "memory_audits_memoryId_createdAt_idx" ON "memory_audits"("memoryId", "createdAt");

-- AddForeignKey
ALTER TABLE "memory_consent_settings" ADD CONSTRAINT "memory_consent_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memory_type_consents" ADD CONSTRAINT "memory_type_consents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memory_candidates" ADD CONSTRAINT "memory_candidates_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memories" ADD CONSTRAINT "memories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memory_versions" ADD CONSTRAINT "memory_versions_memoryId_fkey" FOREIGN KEY ("memoryId") REFERENCES "memories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memory_audits" ADD CONSTRAINT "memory_audits_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Data migration: Sprint 3A migrates Sprint 1's `memory_notes` rows into the
-- new `memories` model. The original `memory_notes` table is NOT dropped and
-- NOT deleted from — `MemoryService`/`MemoryNote` remain in place, deprecated
-- (still written to by onboarding's Reflection step, still read by the
-- Dashboard's memory highlight; see docs/architecture/memory-engine.md
-- "Relationship to Sprint 1's MemoryNote"). Every migrated row is tagged
-- sourceType='MIGRATED_LEGACY' and carries the original memory_notes id +
-- legacy source enum in structuredPayload, per the explicit instruction not
-- to fabricate a conversation/message reference that never existed — old
-- MemoryNote rows have no such reference, so sourceConversationId/
-- sourceMessageId are left NULL rather than invented.
WITH migrated AS (
  INSERT INTO "memories" (
    "id", "userId", "type", "title", "summary", "structuredPayload",
    "status", "consentState", "visibility", "sourceType",
    "sourceConversationId", "sourceMessageId", "version",
    "createdAt", "updatedAt"
  )
  SELECT
    gen_random_uuid()::text,
    mn."userId",
    'CUSTOM'::"MemoryType",
    CASE WHEN length(mn."content") > 60 THEN left(mn."content", 57) || '...' ELSE mn."content" END,
    mn."content",
    jsonb_build_object('migratedFromMemoryNoteId', mn."id", 'legacySource', mn."source"::text),
    'ACCEPTED'::"MemoryStatus",
    'ALLOW_SELECTED'::"MemoryConsentMode",
    'PRIVATE'::"MemoryVisibility",
    'MIGRATED_LEGACY'::"MemorySourceType",
    NULL,
    NULL,
    1,
    mn."createdAt",
    mn."createdAt"
  FROM "memory_notes" mn
  RETURNING "id", "userId", "type", "title", "summary", "structuredPayload", "visibility", "createdAt"
)
INSERT INTO "memory_versions" (
  "id", "memoryId", "version", "type", "title", "summary", "structuredPayload", "visibility", "changeReason", "createdAt"
)
SELECT
  gen_random_uuid()::text,
  m."id",
  1,
  m."type",
  m."title",
  m."summary",
  m."structuredPayload",
  m."visibility",
  'migrated_from_sprint1_memory_note',
  m."createdAt"
FROM migrated m;

-- Audit trail for the migration itself (SYSTEM actor, metadata only — no content).
INSERT INTO "memory_audits" ("id", "memoryId", "userId", "actorType", "action", "metadata", "createdAt")
SELECT
  gen_random_uuid()::text,
  mem."id",
  mem."userId",
  'SYSTEM'::"MemoryActorType",
  'CREATED'::"MemoryAuditAction",
  jsonb_build_object('reason', 'sprint_3a_migration_from_memory_notes'),
  mem."createdAt"
FROM "memories" mem
WHERE mem."sourceType" = 'MIGRATED_LEGACY'::"MemorySourceType";
