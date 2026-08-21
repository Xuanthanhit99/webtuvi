import { EARTHLY_BRANCHES, getPalaceIndex, addPalaceOffset, type EarthlyBranch } from './tu-vi-palace';
import type { TuViCucId } from './tu-vi-cuc';

/**
 * TUVI-TVA-01 / TUVI-TVA-02 / TUVI-TVPHU-01 / TUVI-TV-GRP / TUVI-TP-GRP (`canonical-ruleset-v1.md`
 * §1 rows 13–17, §4) — the Tử Vi anchor (5 Cục × 30-lunar-day table) plus the 14 Chính Tinh's
 * mod-12 offsets. Reproduced from the frozen ruleset, not re-derived or reinterpreted.
 *
 * `TUVI-TVA-02` (Kim Tứ Cục) convention lock, implemented EXACTLY as frozen: the printed table has
 * day 21 in both the Thìn and Mùi cells, day 24 in neither. Per the disclosed, evidenced
 * `CONVENTION_LOCK_REQUIRED` decision, day 24 → Mùi is used here (Mùi's array below reads
 * `[14, 24, 27]`, not the printed `[14, 21, 27]`) — day 21 → Thìn (the undisputed side) is
 * unchanged. This is the one and only place in the codebase where this convention is applied; no
 * other file may restate or reinterpret it.
 *
 * Direction labels ("thuận"/"nghịch"/"clockwise"/"counterclockwise") are never encoded — every
 * star position is `anchor + offset (mod 12)`, per the standing project policy
 * (`canonical-ruleset-v1.md` §2): the domain research found the primary source's own direction
 * *label* disagrees with an external source's label while the decoded numeric *offsets* agree
 * exactly, so only offsets are ever executed.
 */

export const TU_VI_CHINH_TINH_IDS = [
  'Tử Vi',
  'Liêm Trinh',
  'Thiên Đồng',
  'Vũ Khúc',
  'Thái Dương',
  'Thiên Cơ',
  'Thiên Phủ',
  'Thái Âm',
  'Tham Lang',
  'Cự Môn',
  'Thiên Tướng',
  'Thiên Lương',
  'Thất Sát',
  'Phá Quân',
] as const;

export type ChinhTinhId = (typeof TU_VI_CHINH_TINH_IDS)[number];

/** Offsets (mod 12, thuận/forward) from Tử Vi's own position (`0`). VDTTL-1956 p.7. */
export const TU_VI_GROUP_OFFSETS: Readonly<Partial<Record<ChinhTinhId, number>>> = {
  'Tử Vi': 0,
  'Liêm Trinh': 4,
  'Thiên Đồng': 7,
  'Vũ Khúc': 8,
  'Thái Dương': 9,
  'Thiên Cơ': 11,
};

/** Offsets (mod 12, thuận/forward) from Thiên Phủ's own position (`0`). VDTTL-1956 p.9. */
export const THIEN_PHU_GROUP_OFFSETS: Readonly<Partial<Record<ChinhTinhId, number>>> = {
  'Thiên Phủ': 0,
  'Thái Âm': 1,
  'Tham Lang': 2,
  'Cự Môn': 3,
  'Thiên Tướng': 4,
  'Thiên Lương': 5,
  'Thất Sát': 6,
  'Phá Quân': 10,
};

/**
 * The 5×30 Tử Vi-anchor table, one source of truth, transcribed exactly from
 * `canonical-ruleset-v1.md` §4 (Kim Tứ Cục shown with the convention lock already applied — see
 * the module doc comment above). No fallback, no default: `getTuViAnchorPosition` throws if a
 * lookup cannot resolve, rather than silently guessing.
 */
const TU_VI_ANCHOR_TABLE: Readonly<Record<TuViCucId, Readonly<Partial<Record<EarthlyBranch, readonly number[]>>>>> = {
  'Thủy Nhị Cục': {
    Tý: [22, 23],
    Sửu: [1, 24, 25],
    Dần: [2, 3, 26, 27],
    Mão: [4, 5, 28, 29],
    Thìn: [6, 7, 30],
    Tỵ: [8, 9],
    Ngọ: [10, 11],
    Mùi: [12, 13],
    Thân: [14, 15],
    Dậu: [16, 17],
    Tuất: [18, 19],
    Hợi: [20, 21],
  },
  'Mộc Tam Cục': {
    Tý: [25],
    Sửu: [2, 28],
    Dần: [3, 5],
    Mão: [6, 8],
    Thìn: [1, 9, 11],
    Tỵ: [4, 12, 14],
    Ngọ: [7, 15, 17],
    Mùi: [10, 18, 20],
    Thân: [13, 21, 23],
    Dậu: [16, 24, 26],
    Tuất: [19, 27, 29],
    Hợi: [22, 30],
  },
  'Kim Tứ Cục': {
    Tý: [5],
    Sửu: [3, 9],
    Dần: [4, 7, 13],
    Mão: [8, 11, 17],
    Thìn: [2, 12, 15, 21],
    Tỵ: [6, 16, 19, 25],
    Ngọ: [10, 20, 23, 29],
    Mùi: [14, 24, 27], // TUVI-TVA-02 convention lock: day 24 (printed table reads "21" here)
    Thân: [18, 28],
    Dậu: [22],
    Tuất: [26],
    Hợi: [1, 30],
  },
  'Thổ Ngũ Cục': {
    Tý: [7],
    Sửu: [4, 12],
    Dần: [5, 9, 17],
    Mão: [10, 14, 22],
    Thìn: [3, 15, 19, 27],
    Tỵ: [8, 20, 24],
    Ngọ: [1, 13, 25, 29],
    Mùi: [6, 18, 30],
    Thân: [11, 23],
    Dậu: [16, 28],
    Tuất: [21],
    Hợi: [2, 26],
  },
  'Hỏa Lục Cục': {
    Tý: [9, 19],
    Sửu: [5, 15, 25],
    Dần: [6, 11, 21],
    Mão: [12, 17, 27],
    Thìn: [4, 18, 23],
    Tỵ: [10, 24, 29],
    Ngọ: [2, 16, 30],
    Mùi: [8, 22],
    Thân: [14, 28],
    Dậu: [1, 20],
    Tuất: [7, 26],
    Hợi: [3, 13],
  },
};

function mod12(n: number): number {
  return ((n % 12) + 12) % 12;
}

/** Which palace Tử Vi itself occupies, given the chart's Cục and lunar birth day (1–30). */
export function getTuViAnchorPosition(cuc: TuViCucId, lunarDay: number): EarthlyBranch {
  if (!Number.isInteger(lunarDay) || lunarDay < 1 || lunarDay > 30) {
    throw new RangeError(`lunarDay must be an integer 1–30, got ${lunarDay}`);
  }
  const cucTable = TU_VI_ANCHOR_TABLE[cuc];
  for (const branch of EARTHLY_BRANCHES) {
    if (cucTable[branch]?.includes(lunarDay)) {
      return branch;
    }
  }
  throw new Error(`getTuViAnchorPosition found no cell for cuc=${cuc}, lunarDay=${lunarDay} — this indicates a defect in TU_VI_ANCHOR_TABLE (it should be a full 1–30 bijection for every Cục), not a possible real outcome.`);
}

/** TUVI-TVPHU-01 — `ThienPhu0 = (4 − TuVi0) mod 12` (`canonical-ruleset-v1.md` §1 row 15); mirrors
 * Tử Vi across the Dần–Thân axis, coinciding at Dần and Thân. The constant `4` is the mirror-axis
 * formula's own anchor value (not a palace index lookup) — reproduced exactly as derived, not
 * re-decoded here. */
const THIEN_PHU_MIRROR_ANCHOR = 4;

export function getThienPhuPosition(tuViPosition: EarthlyBranch): EarthlyBranch {
  return EARTHLY_BRANCHES[mod12(THIEN_PHU_MIRROR_ANCHOR - getPalaceIndex(tuViPosition))]!;
}

export interface ChinhTinhPlacement {
  readonly star: ChinhTinhId;
  readonly position: EarthlyBranch;
}

export interface CalculateChinhTinhInput {
  cuc: TuViCucId;
  lunarDay: number;
}

/**
 * All 14 Chính Tinh placements, in the fixed `TU_VI_CHINH_TINH_IDS` canonical order (stable output
 * ordering, per this phase's explicit requirement). Co-location (multiple stars sharing a palace)
 * is valid and expected — not treated as an error.
 */
export function calculateChinhTinh({ cuc, lunarDay }: CalculateChinhTinhInput): ReadonlyArray<ChinhTinhPlacement> {
  const tuViPosition = getTuViAnchorPosition(cuc, lunarDay);
  const thienPhuPosition = getThienPhuPosition(tuViPosition);

  const placements: ChinhTinhPlacement[] = TU_VI_CHINH_TINH_IDS.map((star) => {
    const tuViOffset = TU_VI_GROUP_OFFSETS[star];
    if (tuViOffset !== undefined) {
      return { star, position: addPalaceOffset(tuViPosition, tuViOffset) };
    }
    const thienPhuOffset = THIEN_PHU_GROUP_OFFSETS[star];
    if (thienPhuOffset !== undefined) {
      return { star, position: addPalaceOffset(thienPhuPosition, thienPhuOffset) };
    }
    throw new Error(`calculateChinhTinh: star "${star}" belongs to neither TU_VI_GROUP_OFFSETS nor THIEN_PHU_GROUP_OFFSETS — defect in the offset tables, not a possible real outcome.`);
  });

  return Object.freeze(placements);
}
