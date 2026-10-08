CREATE TABLE "tarot_selection_claims" (
    "tokenHash" TEXT NOT NULL,
    "readingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tarot_selection_claims_pkey" PRIMARY KEY ("tokenHash")
);
CREATE UNIQUE INDEX "tarot_selection_claims_readingId_key" ON "tarot_selection_claims"("readingId");
