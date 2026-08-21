import { EARTHLY_BRANCHES, getPalaceIndex, type EarthlyBranch } from './tu-vi-palace';

/**
 * TUVI-MT-01 / TUVI-MT-02 / TUVI-MT-03 (`canonical-ruleset-v1.md` §1 rows 9–11, §5) — Mệnh/Thân
 * placement. Structure directly re-confirmed from VDTTL-1956 p.6–7 ("5. AN MỆNH" / "6. AN THÂN"),
 * `PRIMARY_SOURCE_RECHECKED` across 3 independent reads; the exact mod-12 arithmetic below was
 * derived directly from that prose (Sprint 18A.5) and proven `DETERMINISTICALLY_CROSS_CHECKED`
 * against the primary source's own explicit invariant (Thân limited to 6 palaces) — see
 * `canonical-ruleset-v1.md` §5 for the full derivation and proof. Reproduced here, not re-derived:
 *
 *   R0     = (tháng + 1) mod 12                 [0-indexed Tý=0; R is Dần(2) when tháng=1]
 *   giờ0   = birth-hour branch's own standard index (Tý=0, Sửu=1, …, Hợi=11)
 *   Mệnh0  = (R0 − giờ0) mod 12
 *   Thân0  = (R0 + giờ0) mod 12
 *
 * `lunarMonth` here is passed through UNADJUSTED for leap months — `TUVI-CAL-04`'s convention lock
 * ("a leap month repeats its preceding month's index") is satisfied BY CONSTRUCTION, not by any
 * special-case code path: `convertGregorianToTuViLunarDate` (`tu-vi-calendar.adapter.ts`) already
 * labels a leap month with the same `lunarMonth` number as its preceding regular month (verified in
 * that module's own leap-month boundary test — 2020's leap 4th month and regular 4th month both
 * report `lunarMonth: 4`). `isLeapMonth` is therefore intentionally NOT read anywhere in this file.
 */

const MONTH_REFERENCE_ANCHOR: EarthlyBranch = 'Dần';

function mod12(n: number): number {
  return ((n % 12) + 12) % 12;
}

function getMonthReferenceIndex(lunarMonth: number): number {
  if (!Number.isInteger(lunarMonth) || lunarMonth < 1 || lunarMonth > 12) {
    throw new RangeError(`lunarMonth must be an integer 1–12, got ${lunarMonth}`);
  }
  return mod12(getPalaceIndex(MONTH_REFERENCE_ANCHOR) + (lunarMonth - 1));
}

export interface MenhThanInput {
  /** Lunar birth month, 1–12. Pass the raw `TuViLunarDate.lunarMonth` value directly — do not
   * pre-adjust for `isLeapMonth`; see the module doc comment above for why. */
  lunarMonth: number;
  hourBranch: EarthlyBranch;
}

export function calculateMenhPalace({ lunarMonth, hourBranch }: MenhThanInput): EarthlyBranch {
  const r0 = getMonthReferenceIndex(lunarMonth);
  const hour0 = getPalaceIndex(hourBranch);
  return EARTHLY_BRANCHES[mod12(r0 - hour0)]!;
}

export function calculateThanPalace({ lunarMonth, hourBranch }: MenhThanInput): EarthlyBranch {
  const r0 = getMonthReferenceIndex(lunarMonth);
  const hour0 = getPalaceIndex(hourBranch);
  return EARTHLY_BRANCHES[mod12(r0 + hour0)]!;
}

/** TUVI-MT-03 — the hard invariant: Thân's offset from Mệnh must be one of exactly 6 even values.
 * Implement as a hard assertion wherever both palaces are computed together, not a soft warning. */
export const ALLOWED_THAN_OFFSETS_FROM_MENH: ReadonlyArray<number> = [0, 2, 4, 6, 8, 10];

export function isValidThanOffset(menhPosition: EarthlyBranch, thanPosition: EarthlyBranch): boolean {
  const offset = mod12(getPalaceIndex(thanPosition) - getPalaceIndex(menhPosition));
  return ALLOWED_THAN_OFFSETS_FROM_MENH.includes(offset);
}
