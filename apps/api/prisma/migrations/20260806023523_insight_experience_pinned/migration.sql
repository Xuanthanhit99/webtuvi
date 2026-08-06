-- AlterTable
ALTER TABLE "insight_candidates" ADD COLUMN     "pinned" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "insight_candidates_userId_pinned_idx" ON "insight_candidates"("userId", "pinned");
