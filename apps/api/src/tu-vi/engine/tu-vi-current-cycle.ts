import { getLunarYearForGregorianDate } from '../../eastern-horoscope/engine/lunar-calendar.adapter';
import { TUVI_TIMEZONE_OFFSET_HOURS } from './tu-vi-calendar.adapter';
import type { DaiVanCycle } from './tu-vi-dai-van';
import type { TieuHanStart } from './tu-vi-tieu-han';
import { getTieuHanPalace } from './tu-vi-tieu-han';
import type { EarthlyBranch } from './tu-vi-palace';

/**
 * "Which cycle is current right now" — deliberately kept separate from `buildTuViChart` (which must
 * stay pure/deterministic given only birth input, per its own determinism test). This module is
 * time-dependent by design and is meant to be called fresh at read/response time (mirrors Eastern
 * Horoscope's own `yearEnergy` precedent in `eastern-horoscope-record.service.ts`, which computes
 * `currentLunarYear` live on every read rather than persisting a snapshot that would go stale).
 *
 * `tuoi` (age) convention, disclosed explicitly since the primary source's pages read this session
 * never state it outright: `tuoi = currentLunarYear − birthLunarYear + 1`, the standard Vietnamese
 * nominal/lunar age ("tuổi ta") — not Western actual age. This is applied as a baseline cultural/
 * calendar convention for what the word "tuổi" means in a Vietnamese lunar-calendar context (the
 * same convention this book's own worked examples implicitly use — e.g. "23 tuổi", "34 tuổi" tied
 * directly to lunar-year Đại Hạn/Tiểu Hạn boundaries), NOT a disputed school-specific rule like
 * Tứ Hóa's Bắc Phái/Nam Phái split. Flagged here rather than silently assumed so a future session
 * can verify it directly against the primary text if a dedicated "cách tính tuổi" section is later
 * found (none was located in the pages read this session, across all 6 parts).
 */

export function calculateTuoi(birthLunarYear: number, currentLunarYear: number): number {
  return currentLunarYear - birthLunarYear + 1;
}

export function getCurrentLunarYear(now: Date, timezoneOffsetHours: number = TUVI_TIMEZONE_OFFSET_HOURS): number {
  return getLunarYearForGregorianDate(now, timezoneOffsetHours);
}

/** `null` if `tuoi` falls before the first Đại Hạn cycle starts (a child younger than their Cục's
 * starting age has no current Đại Hạn yet — a real, honest state, not an error) or after the last
 * computed cycle (should not happen in practice — 12 cycles cover well over a century from any
 * Cục's starting age — but handled explicitly rather than silently returning a wrong cycle). */
export function findCurrentDaiVan(cycles: ReadonlyArray<DaiVanCycle>, tuoi: number): DaiVanCycle | null {
  return cycles.find((c) => tuoi >= c.ageStart && tuoi <= c.ageEnd) ?? null;
}

export interface CurrentTieuHan {
  readonly tuoi: number;
  /** `birthLunarYear + tuoi − 1` — the real lunar calendar year this tuổi falls in, so the UI can
   * show "2026" rather than only an abstract age number (per the "2025 / 2026 ← hiện tại / 2027"
   * year-navigation design). Trivial arithmetic on already-known values, not a new calculation. */
  readonly lunarYear: number;
  readonly palace: EarthlyBranch;
}

/** `null` if `tuoi < 13` — the separate, unimplemented child Tiểu Hạn system (never fabricated). */
export function findCurrentTieuHan(start: TieuHanStart, tuoi: number, birthLunarYear: number): CurrentTieuHan | null {
  if (tuoi < 13) return null;
  return { tuoi, lunarYear: birthLunarYear + tuoi - 1, palace: getTieuHanPalace(start, tuoi) };
}

/**
 * A small window of Tiểu Hạn years around `centerTuoi` (e.g. for a "2025 / 2026 ← hiện tại / 2027"
 * style year-navigation UI) — computed here, never re-derived client-side, so the frontend never
 * independently calculates a palace assignment (it only ever reshapes facts this engine already
 * produced). Years below tuổi 13 are silently omitted (the unimplemented child system), never
 * fabricated — the returned array may therefore be shorter than `2*radius+1` near that boundary.
 */
export function findNearbyTieuHan(start: TieuHanStart, centerTuoi: number, birthLunarYear: number, radius = 2): ReadonlyArray<CurrentTieuHan> {
  const results: CurrentTieuHan[] = [];
  for (let tuoi = centerTuoi - radius; tuoi <= centerTuoi + radius; tuoi++) {
    const entry = findCurrentTieuHan(start, tuoi, birthLunarYear);
    if (entry) results.push(entry);
  }
  return Object.freeze(results);
}
