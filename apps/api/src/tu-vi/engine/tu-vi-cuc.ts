import type { HeavenlyStem, EarthlyBranch } from './tu-vi-can-chi';

/**
 * TUVI-CUC-01 (`canonical-ruleset-v1.md` §1 row 12, §3) — Ngũ Hành Cục. VDTTL-1956 p.7 ("7. LẬP
 * CỤC"), `PRIMARY_SOURCE_RECHECKED` across 3 independent reads, all 30 printed cells identical
 * every time — no internal conflict in this specific table (unlike the downstream Tử Vi anchor
 * table's Kim Tứ Cục block, `TUVI-TVA-02` — see the note on `KIM_TU_CUC` below for the scope
 * boundary between the two).
 *
 * Input: birth-year Heavenly Stem (Can) + the Mệnh palace's Earthly Branch (Chi) — NOT the birth
 * year's own Chi, and NOT a Nạp Âm-of-the-month derivation (a Sprint-15-era secondary-source
 * hypothesis this primary text does not support — see `v1-canonical-ruleset.md` §6's correction).
 */

export const TU_VI_CUC_IDS = ['Thủy Nhị Cục', 'Mộc Tam Cục', 'Kim Tứ Cục', 'Thổ Ngũ Cục', 'Hỏa Lục Cục'] as const;
export type TuViCucId = (typeof TU_VI_CUC_IDS)[number];

/** The traditional numeric label for each Cục (e.g. "Thủy Nhị" = Water, number 2) — metadata only,
 * never used as an array/lookup index anywhere in this module (the canonical lookup below is keyed
 * by `TuViCucId` directly, not by this number, to avoid a second implicit ordering). */
export const TU_VI_CUC_NUMBER: Readonly<Record<TuViCucId, number>> = {
  'Thủy Nhị Cục': 2,
  'Mộc Tam Cục': 3,
  'Kim Tứ Cục': 4,
  'Thổ Ngũ Cục': 5,
  'Hỏa Lục Cục': 6,
};

/**
 * The 5 Mệnh-Chi row-groups, in the exact order VDTTL-1956 p.7 prints them. A `Record<EarthlyBranch,
 * number>` rather than a derived/computed group index — an explicit lookup, not an arithmetic
 * formula, to keep the one place that could transpose the table as small and inspectable as
 * possible.
 */
const MENH_CHI_GROUP_INDEX: Readonly<Record<EarthlyBranch, number>> = {
  Tý: 0,
  Sửu: 0,
  Dần: 1,
  Mão: 1,
  Tuất: 1,
  Hợi: 1,
  Thìn: 2,
  Tỵ: 2,
  Ngọ: 3,
  Mùi: 3,
  Thân: 4,
  Dậu: 4,
};

/** The 5 Can column-groups, in the exact order VDTTL-1956 p.7 prints them. */
const CAN_GROUP_INDEX: Readonly<Record<HeavenlyStem, number>> = {
  Giáp: 0,
  Kỷ: 0,
  Ất: 1,
  Canh: 1,
  Bính: 2,
  Tân: 2,
  Đinh: 3,
  Nhâm: 3,
  Mậu: 4,
  Quý: 4,
};

/**
 * The 30 printed cells (5×5 groups), transcribed exactly as `canonical-ruleset-v1.md` §3 reproduces
 * them — row index = `MENH_CHI_GROUP_INDEX`, column index = `CAN_GROUP_INDEX`. This is the single
 * source of truth; nothing else in this module or its callers may restate any part of this table.
 *
 * `KIM_TU_CUC` scope note: this table only determines WHICH of the 5 Cục a chart has — it is
 * completely unconflicted. The separate, genuinely disputed Kim Tứ Cục ambiguity (VDTTL-1956's Tử
 * Vi-anchor table has a lunar day printed in two palaces and none in a third, `TUVI-TVA-02`) is
 * Sprint 18B.4's concern, not this table's — this module produces a `TuViCucId`, and 18B.4 is
 * responsible for correctly selecting its own (separately convention-locked) anchor sub-table once
 * it receives a `'Kim Tứ Cục'` value from here. No day-21/24 logic of any kind exists in this file.
 */
const CUC_TABLE: ReadonlyArray<ReadonlyArray<TuViCucId>> = [
  // col:      Giáp Kỷ           Ất Canh           Bính Tân          Đinh Nhâm         Mậu Quý
  /* Tý,Sửu */ ['Thủy Nhị Cục', 'Hỏa Lục Cục', 'Thổ Ngũ Cục', 'Mộc Tam Cục', 'Kim Tứ Cục'],
  /* Dần,Mão,Tuất,Hợi */ ['Hỏa Lục Cục', 'Thổ Ngũ Cục', 'Mộc Tam Cục', 'Kim Tứ Cục', 'Thủy Nhị Cục'],
  /* Thìn,Tỵ */ ['Mộc Tam Cục', 'Kim Tứ Cục', 'Thủy Nhị Cục', 'Hỏa Lục Cục', 'Thổ Ngũ Cục'],
  /* Ngọ,Mùi */ ['Thổ Ngũ Cục', 'Mộc Tam Cục', 'Kim Tứ Cục', 'Thủy Nhị Cục', 'Hỏa Lục Cục'],
  /* Thân,Dậu */ ['Kim Tứ Cục', 'Thủy Nhị Cục', 'Hỏa Lục Cục', 'Thổ Ngũ Cục', 'Mộc Tam Cục'],
];

export interface CalculateCucInput {
  yearStem: HeavenlyStem;
  menhPosition: EarthlyBranch;
}

/**
 * Pure lookup — no fallback, no default. `yearStem`/`menhPosition` are closed TypeScript literal
 * unions, so an out-of-table value can only happen via a defect in `MENH_CHI_GROUP_INDEX`/
 * `CAN_GROUP_INDEX` themselves (both are exhaustively typed `Record`s, so this is a compile-time
 * guarantee, not just a runtime hope) — guarded explicitly below anyway, per this phase's explicit
 * "impossible lookup throws an internal invariant error, never a silent default" requirement.
 */
export function calculateCuc({ yearStem, menhPosition }: CalculateCucInput): TuViCucId {
  const rowIndex = MENH_CHI_GROUP_INDEX[menhPosition];
  const colIndex = CAN_GROUP_INDEX[yearStem];
  if (rowIndex === undefined || colIndex === undefined) {
    throw new Error(
      `calculateCuc could not resolve a group index for yearStem=${yearStem}, menhPosition=${menhPosition} — this indicates a defect in MENH_CHI_GROUP_INDEX/CAN_GROUP_INDEX, not a possible real outcome (both maps are exhaustive over their closed input types).`,
    );
  }
  const cuc = CUC_TABLE[rowIndex]?.[colIndex];
  if (!cuc) {
    throw new Error(`calculateCuc found no table cell at row=${rowIndex}, col=${colIndex} — this indicates a defect in CUC_TABLE, not a possible real outcome.`);
  }
  return cuc;
}
