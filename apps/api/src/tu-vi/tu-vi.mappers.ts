import type { TuViChart as TuViChartRow, TuViChartHistory } from '@prisma/client';
import { buildTuViChart, type TuViChart as EngineTuViChart } from './engine/tu-vi-chart';
import type { PalaceLayout } from './engine/tu-vi-palace';
import type { ChinhTinhPlacement } from './engine/tu-vi-chinh-tinh';
import type { Core13Placement } from './engine/tu-vi-core13';
import type { PalacePair } from './engine/tu-vi-tuan-triet';
import type { TuHoaPositionAnnotation } from './engine/tu-vi-tu-hoa';
import type { TuViSex } from './engine/tu-vi-canonical-input';

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
  };
  lunarDate: { lunarYear: number; lunarMonth: number; lunarDay: number; isLeapMonth: boolean };
  hourBranch: string;
  canChi: { year: { stem: string; branch: string } };
  palaces: { menh: string; than: string; layout: PalaceLayout };
  cuc: string;
  mainStars: ChinhTinhPlacement[];
  auxiliaryStars: Core13Placement[];
  tuan: PalacePair;
  triet: PalacePair;
  transformations: TuHoaPositionAnnotation[];
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
 * calculation time. */
export function toTuViChartDto(row: TuViChartRow): TuViChartDto {
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
    },
    lunarDate: { lunarYear: row.lunarYear, lunarMonth: row.lunarMonth, lunarDay: row.lunarDay, isLeapMonth: row.isLeapMonth },
    hourBranch: row.hourBranch,
    canChi: { year: { stem: row.yearStem, branch: row.yearBranch } },
    palaces: { menh: row.menhPosition, than: row.thanPosition, layout: row.palaceLayout as unknown as PalaceLayout },
    cuc: row.cuc,
    mainStars: row.mainStars as unknown as ChinhTinhPlacement[],
    auxiliaryStars: row.auxiliaryStars as unknown as Core13Placement[],
    tuan: row.tuan as unknown as PalacePair,
    triet: row.triet as unknown as PalacePair,
    transformations: row.transformations as unknown as TuHoaPositionAnnotation[],
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
  };
}

// Re-exported so callers (record service) don't need to import the engine module directly.
export { buildTuViChart };
