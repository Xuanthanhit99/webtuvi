import { EARTHLY_BRANCHES, type EarthlyBranch } from '../../eastern-horoscope/engine/eastern-horoscope-tables';

/**
 * TUVI-GIO-01 (`canonical-ruleset-v1.md` §1 row 7) — VDTTL-1956, "4. ĐỊNH GIỜ" (p.6), re-verified
 * `PRIMARY_SOURCE_RECHECKED` across 3 independent reads (Sprint 18A.1/18A.2/18A.5). Tý is a single,
 * undivided 23:00–01:00 window — NOT split into "Giờ Tý Sơ"/"Giờ Tý Chính" sub-branches; every
 * other branch is a plain 2-hour block.
 *
 * This function maps clock time to an hour BRANCH LABEL only. It says nothing about which
 * civil/lunar day a 23:00–00:59 birth belongs to for day-dependent calculations — that is a
 * separate concept (`tu-vi-calendar-context.ts`'s `effectiveTuViDate`, `TUVI-GIO-02`) and must
 * never be collapsed into this function. Per Sprint 18B.1's Phase 7 instruction, these two concepts
 * are kept in two separate, independently-testable functions on purpose.
 *
 * Reuses `EarthlyBranch`/`EARTHLY_BRANCHES` from Eastern Horoscope's table module rather than
 * redefining the 12 branch names a second time — this is pure, non-disputed reference data (no
 * Eastern-Horoscope-specific interpretation logic), safe to share across domains.
 */
export const TUVI_HOUR_BRANCH_TABLE: ReadonlyArray<{ readonly branch: EarthlyBranch; readonly startHour: number; readonly endHour: number }> = [
  { branch: 'Sửu', startHour: 1, endHour: 3 },
  { branch: 'Dần', startHour: 3, endHour: 5 },
  { branch: 'Mão', startHour: 5, endHour: 7 },
  { branch: 'Thìn', startHour: 7, endHour: 9 },
  { branch: 'Tỵ', startHour: 9, endHour: 11 },
  { branch: 'Ngọ', startHour: 11, endHour: 13 },
  { branch: 'Mùi', startHour: 13, endHour: 15 },
  { branch: 'Thân', startHour: 15, endHour: 17 },
  { branch: 'Dậu', startHour: 17, endHour: 19 },
  { branch: 'Tuất', startHour: 19, endHour: 21 },
  { branch: 'Hợi', startHour: 21, endHour: 23 },
];

/**
 * Boundary convention (an explicit, disclosed engineering choice — not itself a domain dispute):
 * each branch's window is half-open `[startHour:00, endHour:00)` in 24-hour local Vietnam
 * wall-clock time — the instant exactly at a boundary hour belongs to the branch that is
 * STARTING, not the one ending. Tý is the wraparound branch: `[23:00, 24:00) ∪ [00:00, 01:00)`.
 */
export function getHourBranch(hour: number, minute: number): EarthlyBranch {
  if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    throw new RangeError(`getHourBranch received an out-of-range time: ${hour}:${minute}`);
  }
  if (hour === 23 || hour === 0) {
    return 'Tý';
  }
  const row = TUVI_HOUR_BRANCH_TABLE.find((r) => hour >= r.startHour && hour < r.endHour);
  if (!row) {
    // Unreachable for any valid 1–22 hour given the table above (1–22 is fully covered by 11
    // consecutive 2-hour blocks); guarded explicitly rather than silently returning a wrong branch.
    throw new RangeError(`getHourBranch could not resolve a branch for hour ${hour} — this indicates a bug in TUVI_HOUR_BRANCH_TABLE, not a user-input problem.`);
  }
  return row.branch;
}

export { EARTHLY_BRANCHES };
export type { EarthlyBranch };
