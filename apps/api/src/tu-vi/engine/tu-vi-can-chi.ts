import { getStemBranchForLunarYear, type HeavenlyStem, type EarthlyBranch } from '../../eastern-horoscope/engine/eastern-horoscope-tables';

export type { HeavenlyStem, EarthlyBranch };

/**
 * Sprint 18B.2 — Can Chi facts, scoped to exactly what the frozen `VDTTL_1956_V1` ruleset actually
 * needs, per this phase's own explicit audit instruction ("do not implement unused complexity
 * blindly").
 *
 * Audited against every rule in `canonical-ruleset-v1.md` §1:
 *   - YEAR Can (Thiên Can của năm sinh) — needed by Cục (18B.3), Tuần/Triệt/Tứ Hóa (18B.5), and 5 of
 *     the 13 CORE_13 auxiliary stars (Lộc Tồn, Kình Dương, Đà La, Thiên Khôi, Thiên Việt — 18B.6).
 *     IMPLEMENTED below.
 *   - YEAR Chi (Địa Chi của năm sinh) — needed by the Tuần decade-group lookup (18B.5) and Hỏa
 *     Tinh/Linh Tinh's year-Chi trine group (18B.6). IMPLEMENTED below (as part of the same
 *     Stem+Branch pair — the underlying calculation produces both together).
 *   - MONTH Can/Chi (Thiên Can/Địa Chi của tháng sinh) — audited against every V1 rule; none uses
 *     month STEM or BRANCH. Every V1 rule keyed by month (Mệnh, Thân, Tả Phù, Hữu Bật) uses the raw
 *     lunar month NUMBER (1–12) only, already provided by `TuViLunarDate.lunarMonth`
 *     (`tu-vi-calendar.adapter.ts`). NOT IMPLEMENTED — would be unused complexity.
 *   - DAY Can/Chi — audited the same way; every V1 rule keyed by day (Tử Vi anchor) uses the raw
 *     lunar day NUMBER only, already provided by `TuViLunarDate.lunarDay`. NOT IMPLEMENTED.
 *   - HOUR Can/Chi — audited the same way; every V1 rule keyed by hour uses the hour BRANCH only
 *     (already provided by `tu-vi-hour-branch.ts`'s `getHourBranch`), never the hour STEM. NOT
 *     IMPLEMENTED.
 *
 * Reuses (does not duplicate) `getStemBranchForLunarYear` — standard, non-disputed sexagenary-cycle
 * arithmetic, already anchored and cross-checked against 5 independently-sourced years (1986 Bính
 * Dần, 2013 Quý Tỵ, 2023 Quý Mão, 2024 Giáp Thìn, plus the full 2013–2025 Tết-animal sequence) in
 * Eastern Horoscope's own module (`eastern-horoscope-tables.ts`). Per Phase 4's explicit instruction
 * not to copy a second incompatible implementation of already-reusable pure calendrical math.
 */

export interface TuViYearCanChi {
  lunarYear: number;
  stem: HeavenlyStem;
  branch: EarthlyBranch;
}

/** MUST be given the lunar year (`TuViCalendarContext.lunarDate.lunarYear`), never the Gregorian
 * year — the two diverge for any birth date before that year's Tết (Lunar New Year). */
export function getTuViYearCanChi(lunarYear: number): TuViYearCanChi {
  return getStemBranchForLunarYear(lunarYear);
}
