/**
 * Sprint 17 — deterministic solar→lunar calendar adapter. Ported and verified against the
 * published Ho Ngoc Duc lunar-calendar algorithm (vanng822/amlich, `lib/amlich-aa98.js`, MIT-style
 * attribution-required source; fetched and cross-checked line-by-line this sprint rather than
 * reimplemented from memory — see `docs/domain/eastern-horoscope-rules.md` §6), itself grounded in
 * Jean Meeus's *Astronomical Algorithms* (1998) new-moon and solar-longitude series. Reuses the
 * same calendar-layer choice Sprint 15 already vetted for Vietnamese Tử Vi
 * (`docs/domain/tu-vi/authoritative-sources.md`, SOURCE_ID `HND-ALGORITHM`) — not re-evaluated
 * from scratch.
 *
 * This module computes ONLY what Eastern Horoscope needs: which lunar year a Gregorian date falls
 * in (`LUNAR_NEW_YEAR` boundary, per the Sprint 17 Domain Decision Closure). It intentionally does
 * not expose lunar month/day — Tử Vi's month-index-dependent calculations are out of scope here
 * (`docs/domain/eastern-horoscope-rules.md` §6's explicit "not reusable / not needed" finding).
 *
 * Verified this sprint against 13 independently-sourced real Lunar New Year (Tết) Gregorian dates
 * (2013–2025) — see `eastern-horoscope-calendar.spec.ts`. All 13 pass exactly.
 */

const PI = Math.PI;

/** Vietnam's fixed UTC+7 offset — per the locked scope, no user-selected timezone (this module
 * needs only a birth *year*, not a birth time; the boundary computation itself needs a timezone
 * only to resolve which Gregorian day a new-moon/solar-term instant falls on). */
export const EASTERN_HOROSCOPE_TIMEZONE_OFFSET_HOURS = 7;

function INT(d: number): number {
  return Math.floor(d);
}

function jdFromDate(dd: number, mm: number, yy: number): number {
  const a = INT((14 - mm) / 12);
  const y = yy + 4800 - a;
  const m = mm + 12 * a - 3;
  return dd + INT((153 * m + 2) / 5) + 365 * y + INT(y / 4) - INT(y / 100) + INT(y / 400) - 32045;
}

/** New Moon time (Julian Day, UT) for lunation number `k` counted from the reference new moon near
 * 1900-01-01 (Meeus Ch. 49, truncated periodic-term series). */
function newMoon(k: number): number {
  const T = k / 1236.85;
  const T2 = T * T;
  const T3 = T2 * T;
  const dr = PI / 180;
  let jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
  jd1 = jd1 + 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
  const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
  const Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
  const F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
  let c1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * dr * M);
  c1 = c1 - 0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(dr * 2 * Mpr);
  c1 = c1 - 0.0004 * Math.sin(dr * 3 * Mpr);
  c1 = c1 + 0.0104 * Math.sin(dr * 2 * F) - 0.0051 * Math.sin(dr * (M + Mpr));
  c1 = c1 - 0.0074 * Math.sin(dr * (M - Mpr)) + 0.0004 * Math.sin(dr * (2 * F + M));
  c1 = c1 - 0.0004 * Math.sin(dr * (2 * F - M)) - 0.0006 * Math.sin(dr * (2 * F + Mpr));
  c1 = c1 + 0.001 * Math.sin(dr * (2 * F - Mpr)) + 0.0005 * Math.sin(dr * (2 * Mpr + M));
  const deltat =
    T < -11
      ? 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3
      : -0.000278 + 0.000265 * T + 0.000262 * T2;
  return jd1 + c1 - deltat;
}

/** Sun's true ecliptic longitude in radians [0, 2π) at Julian Ephemeris Day `jdn` (Meeus Ch. 25,
 * truncated series). */
function sunLongitude(jdn: number): number {
  const T = (jdn - 2451545.0) / 36525;
  const T2 = T * T;
  const dr = PI / 180;
  const M = 357.5291 + 35999.0503 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
  const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
  let dl = (1.9146 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M);
  dl = dl + (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) + 0.00029 * Math.sin(dr * 3 * M);
  let l = (L0 + dl) * dr;
  l = l - PI * 2 * INT(l / (PI * 2));
  return l;
}

function getNewMoonDay(k: number, timeZone: number): number {
  return INT(newMoon(k) + 0.5 + timeZone / 24);
}

/** Which of the 12 major solar terms (each 30°) the sun occupies at local midnight of `dayNumber`. */
function getSunLongitudeIndex(dayNumber: number, timeZone: number): number {
  return INT((sunLongitude(dayNumber - 0.5 - timeZone / 24) / PI) * 6);
}

/** New-moon day (JDN) of the lunar month containing the winter solstice ("month 11") for the
 * lunar year associated with Gregorian year `yy`. */
function getLunarMonth11(yy: number, timeZone: number): number {
  const off = jdFromDate(31, 12, yy) - 2415021;
  const k = INT(off / 29.530588853);
  let nm = getNewMoonDay(k, timeZone);
  const sunLong = getSunLongitudeIndex(nm, timeZone);
  if (sunLong >= 9) {
    nm = getNewMoonDay(k - 1, timeZone);
  }
  return nm;
}

/** Offset (in new moons after month-11's anchor `a11`) of the first lunar month with no major
 * solar term crossing it — the leap-month insertion point in a 13-lunation year. */
function getLeapMonthOffset(a11: number, timeZone: number): number {
  const k = INT((a11 - 2415021.076998695) / 29.530588853 + 0.5);
  let last = 0;
  let i = 1;
  let arc = getSunLongitudeIndex(getNewMoonDay(k + i, timeZone), timeZone);
  do {
    last = arc;
    i++;
    arc = getSunLongitudeIndex(getNewMoonDay(k + i, timeZone), timeZone);
  } while (arc !== last && i < 14);
  return i - 1;
}

export interface LunarConversionResult {
  lunarDay: number;
  lunarMonth: number;
  /** The Gregorian-labeled lunar year — e.g. 2024 for the Giáp Thìn year beginning Tết 2024-02-10. */
  lunarYear: number;
  lunarLeap: boolean;
}

/** Convert a Gregorian calendar date to its lunar-calendar representation. This is the single
 * source of truth for lunar-year determination in this module — nothing downstream may
 * recompute or approximate this. */
export function convertSolarToLunar(dd: number, mm: number, yy: number, timeZone = EASTERN_HOROSCOPE_TIMEZONE_OFFSET_HOURS): LunarConversionResult {
  const dayNumber = jdFromDate(dd, mm, yy);
  const k = INT((dayNumber - 2415021.076998695) / 29.530588853);
  let monthStart = getNewMoonDay(k + 1, timeZone);
  if (monthStart > dayNumber) {
    monthStart = getNewMoonDay(k, timeZone);
  }
  let a11 = getLunarMonth11(yy, timeZone);
  let b11 = a11;
  let lunarYear: number;
  if (a11 >= monthStart) {
    lunarYear = yy;
    a11 = getLunarMonth11(yy - 1, timeZone);
  } else {
    lunarYear = yy + 1;
    b11 = getLunarMonth11(yy + 1, timeZone);
  }
  const lunarDay = dayNumber - monthStart + 1;
  const diff = INT((monthStart - a11) / 29);
  let lunarLeap = false;
  let lunarMonth = diff + 11;
  if (b11 - a11 > 365) {
    const leapMonthDiff = getLeapMonthOffset(a11, timeZone);
    if (diff >= leapMonthDiff) {
      lunarMonth = diff + 10;
      if (diff === leapMonthDiff) lunarLeap = true;
    }
  }
  if (lunarMonth > 12) lunarMonth -= 12;
  if (lunarMonth >= 11 && diff < 4) lunarYear -= 1;
  return { lunarDay, lunarMonth, lunarYear, lunarLeap };
}

/** The one function Eastern Horoscope's engine actually needs: given a Gregorian calendar date,
 * which lunar (Can-Chi) year does it belong to, per the locked `LUNAR_NEW_YEAR` boundary
 * convention (`docs/domain/eastern-horoscope-rules.md` §0/§2)? A date before that year's Tết
 * belongs to the previous lunar year — enforced here, not by the caller. */
export function getLunarYearForGregorianDate(date: Date, timeZone = EASTERN_HOROSCOPE_TIMEZONE_OFFSET_HOURS): number {
  const dd = date.getUTCDate();
  const mm = date.getUTCMonth() + 1;
  const yy = date.getUTCFullYear();
  return convertSolarToLunar(dd, mm, yy, timeZone).lunarYear;
}
