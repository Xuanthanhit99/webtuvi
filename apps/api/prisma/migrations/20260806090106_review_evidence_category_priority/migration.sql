/*
  Warnings:

  - Added the required column `category` to the `review_evidence` table without a default value. This is not possible if the table is not empty.
  - Added the required column `priority` to the `review_evidence` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "review_evidence" ADD COLUMN     "category" TEXT NOT NULL,
ADD COLUMN     "priority" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "review_evidence_reviewSectionId_category_idx" ON "review_evidence"("reviewSectionId", "category");

-- CreateIndex
CREATE INDEX "review_evidence_reviewSectionId_priority_idx" ON "review_evidence"("reviewSectionId", "priority");
