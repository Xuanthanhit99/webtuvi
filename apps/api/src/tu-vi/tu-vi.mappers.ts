import type { TuViChart as TuViChartRow, TuViChartHistory } from '@prisma/client';
import { buildTuViChart, type TuViChart as EngineTuViChart } from './engine/tu-vi-chart';
import type { PalaceLayout } from './engine/tu-vi-palace';
import { getDignity, type ChinhTinhDignityPlacement, type DignityState } from './engine/tu-vi-dignity';
import type { ChinhTinhId } from './engine/tu-vi-chinh-tinh';
import type { EarthlyBranch } from './engine/tu-vi-palace';
import type { Core13Placement } from './engine/tu-vi-core13';
import type { PalacePair } from './engine/tu-vi-tuan-triet';
import type { TuHoaPositionAnnotation } from './engine/tu-vi-tu-hoa';
import type { TuViSex } from './engine/tu-vi-canonical-input';
import type { DaiVanCycle } from './engine/tu-vi-dai-van';
import type { TieuHanStart } from './engine/tu-vi-tieu-han';
import { calculateTuoi, getCurrentLunarYear, findCurrentDaiVan, findCurrentTieuHan, findNearbyTieuHan, type CurrentTieuHan } from './engine/tu-vi-current-cycle';

export interface TuViChartDto {
  id: string;
  status: TuViChartRow['status'];
  /** `YYYY-MM-DD`. */
  birthDate: string;
  /** `HH:mm`. */
  birthTime: string;
  sex: TuViSex;
  versions: {
    engineVersion: string;
    calendarVersion: string;
    rulesetVersion: string;
    mainStarVersion: string;
    auxiliaryVersion: string;
    tuanTrietVersion: string;
    tuHoaVersion: string;
    dignityVersion: string;
    cycleVersion: string;
  };
  lunarDate: { lunarYear: number; lunarMonth: number; lunarDay: number; isLeapMonth: boolean };
  hourBranch: string;
  canChi: { year: { stem: string; branch: string } };
  palaces: { menh: string; than: string; layout: PalaceLayout };
  cuc: string;
  mainStars: ChinhTinhDignityPlacement[];
  auxiliaryStars: Core13Placement[];
  tuan: PalacePair;
  triet: PalacePair;
  transformations: TuHoaPositionAnnotation[];
  /** All 12 Đại Vận cycles — empty for a chart calculated before this feature shipped (never
   * fabricated; the frontend renders nothing for an empty array rather than guessing). */
  daiVan: DaiVanCycle[];
  /** `null` for a chart calculated before this feature shipped. */
  tieuHanStart: TieuHanStart | null;
  /** Computed FRESH on every read from today's real date — never persisted, never stale (mirrors
   * Eastern Horoscope's own `yearEnergy` precedent). `null` if `daiVan` is empty (pre-feature chart)
   * or the person's current tuổi falls before their first Đại Hạn cycle starts. */
  currentDaiVan: DaiVanCycle | null;
  /** Same freshness guarantee as `currentDaiVan`. `null` if `tieuHanStart` is missing or the
   * person's current tuổi is under 13 (the separate, unimplemented child Tiểu Hạn system). */
  currentTieuHan: CurrentTieuHan | null;
  /** A small year-navigation window (±2 years around the current one, computed server-side —
   * frontend must never re-derive a palace assignment itself). Empty for a pre-feature chart or a
   * person entirely under the age-13 boundary. */
  nearbyTieuHan: CurrentTieuHan[];
  /** Additive from Sprint 18B.10 — null until AI interpretation has been generated. A chart is
   * fully real and viewable before this exists; interpretation is additive, never a precondition
   * (mirrors Eastern Horoscope's own precedent exactly). */
  interpretation: string | null;
  interpretedAt: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}

export interface TuViChartHistoryDto {
  id: string;
  action: TuViChartHistory['action'];
  detail: string;
  createdAt: string;
}

/** Reshapes a persisted `TuViChart` Prisma row back into the exact engine output shape — every
 * JSON column is read back as-is (never recomputed), matching what `buildTuViChart` produced at
 * calculation time. `now` defaults to the real current time; overridable for tests, mirrors
 * `toEasternHoroscopeProfileDto`'s own `now` parameter precedent exactly. */
export function toTuViChartDto(row: TuViChartRow, now: Date = new Date()): TuViChartDto {
  // A chart calculated before Miếu/Vượng/Đắc/Hãm shipped has `mainStars` entries with no `dignity`
  // (found during the Time Cycles pass's own historical-chart-compatibility QA, via a real database
  // inspection, not merely inferred). Unlike `daiVan`/`tieuHanStart` (which need context — sex,
  // year stem — not present on a bare star entry), dignity is a pure function of (star, position)
  // alone, both of which are always present — so it's HEALED here via the same tested `getDignity`
  // lookup, rather than merely hidden. This is not fabrication: it's the same real deterministic
  // fact that was always true for that star, simply not stored inline before this feature shipped.
  const mainStars = (row.mainStars as unknown as Array<{ star: ChinhTinhId; position: EarthlyBranch; dignity?: DignityState }>).map((s) =>
    s.dignity ? (s as ChinhTinhDignityPlacement) : { ...s, dignity: getDignity(s.star, s.position) },
  );

  const daiVan = (row.daiVan as unknown as DaiVanCycle[] | null) ?? [];
  // A pre-feature chart's backfilled `{}` (see the cycle-persistence migration) has no `startPalace`
  // — normalized to `null` here so every consumer can rely on a simple null-check, never `{}`.
  const rawTieuHanStart = row.tieuHanStart as unknown as TieuHanStart | null;
  const tieuHanStart = rawTieuHanStart?.startPalace ? rawTieuHanStart : null;

  let currentDaiVan: DaiVanCycle | null = null;
  let currentTieuHan: CurrentTieuHan | null = null;
  let nearbyTieuHan: CurrentTieuHan[] = [];
  if (daiVan.length > 0 || tieuHanStart?.startPalace) {
    const currentLunarYear = getCurrentLunarYear(now);
    const tuoi = calculateTuoi(row.lunarYear, currentLunarYear);
    if (daiVan.length > 0) currentDaiVan = findCurrentDaiVan(daiVan, tuoi);
    if (tieuHanStart?.startPalace) {
      currentTieuHan = findCurrentTieuHan(tieuHanStart, tuoi, row.lunarYear);
      nearbyTieuHan = [...findNearbyTieuHan(tieuHanStart, tuoi, row.lunarYear)];
    }
  }

  return {
    id: row.id,
    status: row.status,
    birthDate: row.birthDate.toISOString().slice(0, 10),
    birthTime: row.birthTime,
    sex: row.sex as TuViSex,
    versions: {
      engineVersion: row.engineVersion,
      calendarVersion: row.calendarVersion,
      rulesetVersion: row.rulesetVersion,
      mainStarVersion: row.mainStarVersion,
      auxiliaryVersion: row.auxiliaryVersion,
      tuanTrietVersion: row.tuanTrietVersion,
      tuHoaVersion: row.tuHoaVersion,
      dignityVersion: row.dignityVersion,
      cycleVersion: row.cycleVersion,
    },
    lunarDate: { lunarYear: row.lunarYear, lunarMonth: row.lunarMonth, lunarDay: row.lunarDay, isLeapMonth: row.isLeapMonth },
    hourBranch: row.hourBranch,
    canChi: { year: { stem: row.yearStem, branch: row.yearBranch } },
    palaces: { menh: row.menhPosition, than: row.thanPosition, layout: row.palaceLayout as unknown as PalaceLayout },
    cuc: row.cuc,
    mainStars,
    auxiliaryStars: row.auxiliaryStars as unknown as Core13Placement[],
    tuan: row.tuan as unknown as PalacePair,
    triet: row.triet as unknown as PalacePair,
    transformations: row.transformations as unknown as TuHoaPositionAnnotation[],
    daiVan,
    tieuHanStart,
    currentDaiVan,
    currentTieuHan,
    nearbyTieuHan,
    interpretation: row.interpretation,
    interpretedAt: row.interpretedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    archivedAt: row.archivedAt?.toISOString() ?? null,
  };
}

export function toTuViChartHistoryDto(entry: TuViChartHistory): TuViChartHistoryDto {
  return { id: entry.id, action: entry.action, detail: entry.detail, createdAt: entry.createdAt.toISOString() };
}

/** The exact shape a `create()` call needs — computed once from the engine, never partially. */
export function toCreateData(chart: EngineTuViChart) {
  return {
    birthDate: new Date(`${chart.input.birthDate}T00:00:00.000Z`),
    birthTime: chart.input.birthTime,
    sex: chart.input.sex,
    engineVersion: chart.versions.engineVersion,
    calendarVersion: chart.versions.calendarVersion,
    rulesetVersion: chart.versions.rulesetVersion,
    mainStarVersion: chart.versions.mainStarVersion,
    auxiliaryVersion: chart.versions.auxiliaryVersion,
    tuanTrietVersion: chart.versions.tuanTrietVersion,
    tuHoaVersion: chart.versions.tuHoaVersion,
    dignityVersion: chart.versions.dignityVersion,
    cycleVersion: chart.versions.cycleVersion,
    lunarYear: chart.calendar.lunarDate.lunarYear,
    lunarMonth: chart.calendar.lunarDate.lunarMonth,
    lunarDay: chart.calendar.lunarDate.lunarDay,
    isLeapMonth: chart.calendar.lunarDate.isLeapMonth,
    hourBranch: chart.calendar.hourBranch,
    yearStem: chart.canChi.year.stem,
    yearBranch: chart.canChi.year.branch,
    menhPosition: chart.palaces.menh,
    thanPosition: chart.palaces.than,
    cuc: chart.cuc,
    palaceLayout: chart.palaces.layout,
    mainStars: chart.mainStars as unknown as object,
    auxiliaryStars: chart.auxiliaryStars as unknown as object,
    tuan: chart.tuan as unknown as object,
    triet: chart.triet as unknown as object,
    transformations: chart.transformations as unknown as object,
    daiVan: chart.daiVan as unknown as object,
    tieuHanStart: chart.tieuHanStart as unknown as object,
  };
}

// Re-exported so callers (record service) don't need to import the engine module directly.
export { buildTuViChart };
