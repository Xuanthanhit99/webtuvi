import { convertSolarToLunar } from '../../eastern-horoscope/engine/lunar-calendar.adapter';

/**
 * Sprint 18B.1 — Tử Vi's calendar adapter.
 *
 * WRAPS, does not duplicate, the already-verified Hồ Ngọc Đức solar→lunar algorithm ported for
 * Eastern Horoscope (`../../eastern-horoscope/engine/lunar-calendar.adapter.ts`) — per
 * `docs/domain/tu-vi/authoritative-sources.md`'s own finding (`SOURCE_ID HND-ALGORITHM`) that this
 * is the same calendar-layer source already vetted for Tử Vi, and per
 * `docs/domain/tu-vi/sprint-18b-revised-entry-gate.md`'s explicit instruction not to reimplement
 * verified astronomical math a second time. Eastern Horoscope's own module only *exposes and tests*
 * the lunar YEAR (Eastern Horoscope needs nothing else); this adapter uses `convertSolarToLunar`'s
 * full return value (day/month/leap flag), which the underlying function already computes
 * internally — no new astronomical calculation is added anywhere in this file.
 *
 * Tử Vi keeps its own timezone constant and version identifier (rather than importing Eastern
 * Horoscope's) so the two domains' locks stay independently traceable even though both currently
 * resolve to the same UTC+7 value — see `canonical-ruleset-v1.md` §1, rows `TUVI-CAL-01`/`02`.
 */
export const TUVI_TIMEZONE_OFFSET_HOURS = 7;

export const TUVI_CALENDAR_VERSION = 'tuvi-calendar-hnd-v1';

export interface TuViLunarDate {
  lunarYear: number;
  lunarMonth: number;
  lunarDay: number;
  isLeapMonth: boolean;
}

/**
 * Convert a Gregorian calendar date to its Vietnamese lunar-calendar representation.
 *
 * This function performs NO Tử-Vi-specific interpretation of the result — no leap-month input
 * convention is applied (`TUVI-CAL-04`'s "a leap month repeats its preceding month's index for
 * Mệnh/Thân's `tháng` input" is a later-phase concern, consumed by whichever phase implements
 * Mệnh/Thân), and no Mệnh/Thân/Cục calculation happens here. It returns the raw calendar fact
 * only, per Sprint 18B.1's explicit scope boundary.
 */
export function convertGregorianToTuViLunarDate(year: number, month: number, day: number): TuViLunarDate {
  const result = convertSolarToLunar(day, month, year, TUVI_TIMEZONE_OFFSET_HOURS);
  return {
    lunarYear: result.lunarYear,
    lunarMonth: result.lunarMonth,
    lunarDay: result.lunarDay,
    isLeapMonth: result.lunarLeap,
  };
}
