import type { HeavenlyStem } from './tu-vi-can-chi';
import type { ChinhTinhId } from './tu-vi-chinh-tinh';
import type { Core13StarId } from './tu-vi-core13';

/**
 * TUVI-TUHOA-01 (`canonical-ruleset-v1.md` §1 row 20) — Tứ Hóa, VDTTL-1956 pp.13–14,
 * `PRIMARY_SOURCE_RECHECKED` ×3, all 40 cells identical every time, cross-checked against its own
 * worked example (Đinh year). Single source of truth; no cell may be restated elsewhere. No school
 * blending: this is exactly VDTTL-1956's own table, not Bắc Phái's or Nam Phái's.
 *
 * Every one of the 40 transformation targets is a member of the already-implemented 14 Chính Tinh
 * (`tu-vi-chinh-tinh.ts`) or CORE_13 (`tu-vi-core13.ts`) star sets — confirmed by construction here
 * (`TuHoaTargetStar = ChinhTinhId | Core13StarId`, a compile-time guarantee, not just a runtime
 * hope). Tứ Hóa therefore only ever ANNOTATES an already-placed star with which transformation it
 * received (`annotateTuHoaPositions`) — it never recomputes or independently derives any star's
 * palace position.
 *
 * One spelling normalization, disclosed (not silent): VDTTL-1956's own Tứ Hóa table prints "Tả
 * Phụ" for Nhâm's Hóa Khoa target — the same star this codebase's CORE_13 canonical ID spells "Tả
 * Phù" everywhere else (already noted in `canonical-ruleset-v1.md` §1 row 25). Normalized to "Tả
 * Phù" here so the type-level guarantee above holds; not a placement or convention decision, purely
 * a spelling-variant reconciliation of one already-implemented star's own canonical name.
 */

export const TU_HOA_TRANSFORMATIONS = ['Hóa Lộc', 'Hóa Quyền', 'Hóa Khoa', 'Hóa Kỵ'] as const;
export type TuHoaTransformation = (typeof TU_HOA_TRANSFORMATIONS)[number];

export type TuHoaTargetStar = ChinhTinhId | Core13StarId;

interface TuHoaRow {
  readonly hoaLoc: TuHoaTargetStar;
  readonly hoaQuyen: TuHoaTargetStar;
  readonly hoaKhoa: TuHoaTargetStar;
  readonly hoaKy: TuHoaTargetStar;
}

const TU_HOA_TABLE: Readonly<Record<HeavenlyStem, TuHoaRow>> = {
  Giáp: { hoaLoc: 'Liêm Trinh', hoaQuyen: 'Phá Quân', hoaKhoa: 'Vũ Khúc', hoaKy: 'Thái Dương' },
  Ất: { hoaLoc: 'Thiên Cơ', hoaQuyen: 'Thiên Lương', hoaKhoa: 'Tử Vi', hoaKy: 'Thái Âm' },
  Bính: { hoaLoc: 'Thiên Đồng', hoaQuyen: 'Thiên Cơ', hoaKhoa: 'Văn Xương', hoaKy: 'Liêm Trinh' },
  Đinh: { hoaLoc: 'Thái Âm', hoaQuyen: 'Thiên Đồng', hoaKhoa: 'Thiên Cơ', hoaKy: 'Cự Môn' },
  Mậu: { hoaLoc: 'Tham Lang', hoaQuyen: 'Thái Âm', hoaKhoa: 'Hữu Bật', hoaKy: 'Thiên Cơ' },
  Kỷ: { hoaLoc: 'Vũ Khúc', hoaQuyen: 'Tham Lang', hoaKhoa: 'Thiên Lương', hoaKy: 'Văn Khúc' },
  Canh: { hoaLoc: 'Thái Dương', hoaQuyen: 'Vũ Khúc', hoaKhoa: 'Thái Âm', hoaKy: 'Thiên Đồng' },
  Tân: { hoaLoc: 'Cự Môn', hoaQuyen: 'Thiên Lương', hoaKhoa: 'Văn Khúc', hoaKy: 'Văn Xương' },
  Nhâm: { hoaLoc: 'Thiên Lương', hoaQuyen: 'Tử Vi', hoaKhoa: 'Tả Phù', hoaKy: 'Vũ Khúc' }, // hoaKhoa: printed "Tả Phụ" — normalized, see module doc comment
  Quý: { hoaLoc: 'Phá Quân', hoaQuyen: 'Cự Môn', hoaKhoa: 'Thái Âm', hoaKy: 'Tham Lang' },
};

export interface TuHoaAssignment {
  readonly transformation: TuHoaTransformation;
  readonly targetStar: TuHoaTargetStar;
}

/** Always exactly 4 assignments (Lộc, Quyền, Khoa, Kỵ, in that fixed order), one per transformation,
 * never more, never fewer, for any of the 10 valid year Cans. */
export function calculateTuHoa(yearStem: HeavenlyStem): ReadonlyArray<TuHoaAssignment> {
  const row = TU_HOA_TABLE[yearStem];
  if (!row) {
    throw new Error(`calculateTuHoa: no row for yearStem=${yearStem} — defect in TU_HOA_TABLE, not a possible real outcome (all 10 Cans must be covered).`);
  }
  return Object.freeze([
    { transformation: 'Hóa Lộc', targetStar: row.hoaLoc },
    { transformation: 'Hóa Quyền', targetStar: row.hoaQuyen },
    { transformation: 'Hóa Khoa', targetStar: row.hoaKhoa },
    { transformation: 'Hóa Kỵ', targetStar: row.hoaKy },
  ]);
}

export interface TuHoaPositionAnnotation extends TuHoaAssignment {
  readonly position: string;
}

/**
 * Annotates each Tứ Hóa assignment with the position its target star ALREADY occupies (from the
 * already-computed 14-Chính-Tinh and 13-CORE_13 placement arrays) — never recomputes a position.
 * Throws if a target star cannot be found in either array (would indicate a defect upstream, not a
 * possible real outcome given the compile-time `TuHoaTargetStar` guarantee).
 */
export function annotateTuHoaPositions(
  tuHoa: ReadonlyArray<TuHoaAssignment>,
  chinhTinh: ReadonlyArray<{ readonly star: string; readonly position: string }>,
  core13: ReadonlyArray<{ readonly star: string; readonly position: string }>,
): ReadonlyArray<TuHoaPositionAnnotation> {
  return Object.freeze(
    tuHoa.map((assignment) => {
      const found = chinhTinh.find((p) => p.star === assignment.targetStar) ?? core13.find((p) => p.star === assignment.targetStar);
      if (!found) {
        throw new Error(`annotateTuHoaPositions: target star "${assignment.targetStar}" not found in either the 14 Chính Tinh or CORE_13 placement arrays — defect upstream, not a possible real outcome.`);
      }
      return { ...assignment, position: found.position };
    }),
  );
}
