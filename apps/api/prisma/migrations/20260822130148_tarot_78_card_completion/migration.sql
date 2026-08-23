-- AlterTable
ALTER TABLE "tarot_cards" ADD COLUMN     "careerMeaning" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "deckVersion" TEXT NOT NULL DEFAULT 'tarot-v1-78',
ADD COLUMN     "financeMeaning" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "loveMeaning" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "nameVi" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "reflectionPrompts" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "selfMeaning" TEXT NOT NULL DEFAULT '';
