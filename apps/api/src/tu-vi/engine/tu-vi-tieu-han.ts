import { addPalaceOffset, type EarthlyBranch } from './tu-vi-palace';
import type { TuViSex } from './tu-vi-canonical-input';

/**
 * Tiểu Hạn (Lưu Niên Tiểu Hạn) — the annual cycle system for adults (age ≥ 13; VDTTL-1956 p.20
 * marks 13 as the age a child switches from the separate child-hạn system, dv06 §21.3, to this
 * adult system — that child-specific table is NOT implemented here, see note below).
 *
 * Source: VDTTL-1956 dv01, "10.3. Lưu niên tiểu hạn" (p.21–22), independently re-read directly
 * against the PDF page-image scan.
 *
 * Direction rule, verbatim: "Nam khởi lưu theo chiều thuận. Nữ khởi lưu theo chiều nghịch." —
 * explicitly SEX-ONLY (unlike Đại Vận, this does NOT also depend on the birth year Can's yin-yang
 * polarity — confirmed by direct reading, not assumed to mirror Đại Vận).
 *
 * Starting-palace table, keyed by the birth year's Earthly Branch (the printed table groups the 12
 * branches into 4 rows of 3; transcribed exactly, verified complete — 4×3 = 12/12 branches covered):
 *
 *   Dần, Ngọ, Tuất  → Thìn
 *   Tỵ, Dậu, Sửu    → Mùi
 *   Thân, Tý, Thìn  → Tuất
 *   Hợi, Mão, Mùi   → Sửu
 *
 * Independently cross-checked against the book's own worked example: "Con trai sinh năm Tý...
 * khởi Tý từ cung Tuất" (year Tý is in the Thân/Tý/Thìn group → Tuất, matching the table) "...rồi
 * theo chiều thuận, ghi chữ Sửu bên cung Hợi, chữ Dần bên cung Tý" — this maps each subsequent
 * CALENDAR year's Chi (not directly "age") onto the next palace along the walk direction; since a
 * person's age N always falls in the calendar year whose Chi is N−1 steps after their birth year's
 * Chi, this is arithmetically identical to "age N → (N−1) steps from the starting palace" — the
 * formula implemented below, cross-checked against this worked example's first 3 steps (age 1 → 0
 * steps → Tuất; age 2 → 1 step thuận → Hợi; age 3 → 2 steps thuận → Tý — all match).
 *
 * Explicitly OUT OF SCOPE (not implemented): the separate child (age < 13) Tiểu Hạn table (dv06
 * §21.3) — its OCR-derived table for ages 5–12 was flagged as uncertain (linearized-table
 * reconstruction, not independently visually re-verified this session) and is deferred.
 */

const TIEU_HAN_START_BY_YEAR_BRANCH: Readonly<Record<EarthlyBranch, EarthlyBranch>> = {
  Dần: 'Thìn', Ngọ: 'Thìn', Tuất: 'Thìn',
  Tỵ: 'Mùi', Dậu: 'Mùi', Sửu: 'Mùi',
  Thân: 'Tuất', Tý: 'Tuất', Thìn: 'Tuất',
  Hợi: 'Sửu', Mão: 'Sửu', Mùi: 'Sửu',
};

export interface CalculateTieuHanStartInput {
  yearBranch: EarthlyBranch;
  sex: TuViSex;
}

export interface TieuHanStart {
  readonly startPalace: EarthlyBranch;
  readonly thuan: boolean;
}

/** The fixed starting palace + walk direction for this person — reused by `getTieuHanPalace` for
 * any age, since the direction/start never changes for a given chart. */
export function calculateTieuHanStart({ yearBranch, sex }: CalculateTieuHanStartInput): TieuHanStart {
  const startPalace = TIEU_HAN_START_BY_YEAR_BRANCH[yearBranch];
  if (!startPalace) {
    throw new Error(`calculateTieuHanStart: no starting palace for yearBranch="${yearBranch}" — defect in TIEU_HAN_START_BY_YEAR_BRANCH (must cover all 12 branches), not a possible real outcome.`);
  }
  return Object.freeze({ startPalace, thuan: sex === 'Nam' });
}

/** Tiểu Hạn palace for a given adult age (≥ 13; ages < 13 use the unimplemented child system —
 * see module doc comment). Cycles with period 12, matching the 12-Chi calendar-year cycle. */
export function getTieuHanPalace(start: TieuHanStart, age: number): EarthlyBranch {
  if (!Number.isInteger(age) || age < 13) {
    throw new RangeError(`getTieuHanPalace: age must be an integer >= 13 (ages < 13 use the separate, unimplemented child Tiểu Hạn system), got ${age}`);
  }
  const steps = (age - 1) % 12;
  return addPalaceOffset(start.startPalace, start.thuan ? steps : -steps);
}
