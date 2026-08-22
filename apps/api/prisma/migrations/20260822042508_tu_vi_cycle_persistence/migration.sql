/*
  Warnings:

  - Added the required columns `cycleVersion`, `daiVan`, `tieuHanStart` to the `tu_vi_charts` table.

  Existing local-dev rows (this feature has never been deployed to production — no real user data
  is affected) are backfilled with an empty Đại Vận/Tiểu Hạn state (`daiVan = []`,
  `tieuHanStart = {}`, `cycleVersion = 'tuvi-cycle-v1'` matching `TUVI_CYCLE_VERSION`). The API/
  frontend both treat an empty `daiVan` / a `tieuHanStart` missing `startPalace` as "not available
  for this chart" rather than crashing (per this feature's own historical-chart-compatibility
  design — see `tu-vi.mappers.ts`'s `toTuViChartDto`) — pre-existing dev charts simply don't show
  the new time-cycle UI until recalculated, exactly like any other pre-feature chart would.
  Defaults are then dropped so every future insert must set these explicitly, same as every other
  required column on this table.
*/
-- AlterTable
ALTER TABLE "tu_vi_charts"
  ADD COLUMN "cycleVersion" TEXT NOT NULL DEFAULT 'tuvi-cycle-v1',
  ADD COLUMN "daiVan" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN "tieuHanStart" JSONB NOT NULL DEFAULT '{}';

ALTER TABLE "tu_vi_charts"
  ALTER COLUMN "cycleVersion" DROP DEFAULT,
  ALTER COLUMN "daiVan" DROP DEFAULT,
  ALTER COLUMN "tieuHanStart" DROP DEFAULT;
