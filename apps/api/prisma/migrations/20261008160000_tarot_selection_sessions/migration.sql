-- Tarot selection sessions are server-owned and one-use.
CREATE TABLE "tarot_selection_sessions" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" "TarotReadingType" NOT NULL,
  "seed" TEXT NOT NULL,
  "shuffledCardIds" JSONB NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "consumedAt" TIMESTAMP(3),
  "readingId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "tarot_selection_sessions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "tarot_selection_sessions_readingId_key" ON "tarot_selection_sessions"("readingId");
CREATE INDEX "tarot_selection_sessions_userId_expiresAt_idx" ON "tarot_selection_sessions"("userId", "expiresAt");
ALTER TABLE "tarot_selection_sessions" ADD CONSTRAINT "tarot_selection_sessions_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tarot_selection_sessions" ADD CONSTRAINT "tarot_selection_sessions_readingId_fkey"
  FOREIGN KEY ("readingId") REFERENCES "tarot_readings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
