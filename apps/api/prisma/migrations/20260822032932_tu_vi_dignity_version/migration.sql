/*
  Warnings:

  - Added the required column `dignityVersion` to the `tu_vi_charts` table.

  Existing local-dev rows (this feature has never been deployed to production — no real user data
  is affected) are backfilled with the current dignity ruleset version (`tuvi-dignity-v1`, matching
  `TUVI_DIGNITY_VERSION` in `tu-vi-chart.ts`), then the column default is dropped so every future
  insert must set it explicitly, same as every other version column on this table.
*/
-- AlterTable
ALTER TABLE "tu_vi_charts" ADD COLUMN "dignityVersion" TEXT NOT NULL DEFAULT 'tuvi-dignity-v1';

-- Backfill complete, drop the default so it behaves like every other required version column.
ALTER TABLE "tu_vi_charts" ALTER COLUMN "dignityVersion" DROP DEFAULT;
