import type { EarthlyBranch } from './tu-vi-palace';
import type { ChinhTinhId, ChinhTinhPlacement } from './tu-vi-chinh-tinh';

/**
 * Miếu/Vượng/Đắc/Hãm — star dignity/brightness states, scoped to exactly the 14 Chính Tinh (per
 * VDTTL-1956 §1.6's own explicit scoping: "Chính diệu thủ Mệnh... Miếu địa? Vượng địa? Đắc địa? Hãm
 * địa?" — auxiliary/CORE_13 stars are never classified this way anywhere in the source).
 *
 * Source: VDTTL-1956 dv02 (Phần 2 — Luận Đoán 12 Cung), "2. ĐỊNH DANH" (definitions, p.31–32) and
 * "3. ĐẶC TÍNH CÁC SAO" §3.1–3.14 (one table per star, p.33–38). A 5-state system, not 4:
 *
 *   Miếu địa   — "Vị trí tốt đẹp nhất đối với một sao" (best position for a star)
 *   Vượng địa  — "Vị trí thuận lợi đối với một sao" (favorable position)
 *   Đắc địa    — "Vị trí hợp với một sao" (fitting position)
 *   Bình hòa   — "Vị trí không làm cho sao thêm sáng sủa, mà cũng không làm cho sao bị mờ ám" (neutral)
 *   Hãm địa    — "Vị trí bất lợi đối với một sao, làm cho sao đó bị mờ ám" (unfavorable, dims the star)
 *
 * Extraction discipline for this table (higher than the project's usual single-pass bar, given the
 * stakes of shipping star-strength as a permanent chart fact): OCR-extracted once, then INDEPENDENTLY
 * re-read by a second pass directly against the dv02 PDF page-image scans (not the OCR text) for
 * every one of the 14 stars — not a spot check. Every star's branch set was verified to partition
 * the 12 Earthly Branches exactly once (a star's Miếu+Vượng+Đắc+Bình hòa+Hãm branches always sum to
 * 12, with no branch repeated and none omitted) — see `tu-vi-dignity.spec.ts`'s completeness test.
 * Tử Vi and Thiên Phủ notably have no Hãm địa state at all in this text — confirmed correct on the
 * scan (not an extraction artifact), consistent with their role as the two "emperor"/"treasury"
 * anchor stars.
 */

export const TU_VI_DIGNITY_STATES = ['Miếu địa', 'Vượng địa', 'Đắc địa', 'Bình hòa', 'Hãm địa'] as const;
export type DignityState = (typeof TU_VI_DIGNITY_STATES)[number];

const DIGNITY_TABLE: Readonly<Record<ChinhTinhId, Readonly<Partial<Record<DignityState, readonly EarthlyBranch[]>>>>> = {
  'Tử Vi': {
    'Miếu địa': ['Tỵ', 'Ngọ', 'Dần', 'Thân'],
    'Vượng địa': ['Thìn', 'Tuất'],
    'Đắc địa': ['Sửu', 'Mùi'],
    'Bình hòa': ['Hợi', 'Tý', 'Mão', 'Dậu'],
  },
  'Liêm Trinh': {
    'Miếu địa': ['Thìn', 'Tuất'],
    'Vượng địa': ['Tý', 'Ngọ', 'Dần', 'Thân'],
    'Đắc địa': ['Sửu', 'Mùi'],
    'Hãm địa': ['Tỵ', 'Hợi', 'Mão', 'Dậu'],
  },
  'Thiên Đồng': {
    'Miếu địa': ['Dần', 'Thân'],
    'Vượng địa': ['Tý'],
    'Đắc địa': ['Mão', 'Tỵ', 'Hợi'],
    'Hãm địa': ['Ngọ', 'Dậu', 'Thìn', 'Tuất', 'Sửu', 'Mùi'],
  },
  'Vũ Khúc': {
    'Miếu địa': ['Thìn', 'Tuất', 'Sửu', 'Mùi'],
    'Vượng địa': ['Dần', 'Thân', 'Tý', 'Ngọ'],
    'Đắc địa': ['Mão', 'Dậu'],
    'Hãm địa': ['Tỵ', 'Hợi'],
  },
  'Thái Dương': {
    'Miếu địa': ['Tỵ', 'Ngọ'],
    'Vượng địa': ['Dần', 'Mão', 'Thìn'],
    'Đắc địa': ['Sửu', 'Mùi'],
    'Hãm địa': ['Thân', 'Dậu', 'Tuất', 'Hợi', 'Tý'],
  },
  'Thiên Cơ': {
    'Miếu địa': ['Thìn', 'Tuất', 'Mão', 'Dậu'],
    'Vượng địa': ['Tỵ', 'Thân'],
    'Đắc địa': ['Tý', 'Ngọ', 'Sửu', 'Mùi'],
    'Hãm địa': ['Dần', 'Hợi'],
  },
  'Thiên Phủ': {
    'Miếu địa': ['Dần', 'Thân', 'Tý', 'Ngọ'],
    'Vượng địa': ['Thìn', 'Tuất'],
    'Đắc địa': ['Tỵ', 'Hợi', 'Mùi'],
    'Bình hòa': ['Mão', 'Dậu', 'Sửu'],
  },
  'Thái Âm': {
    'Miếu địa': ['Dậu', 'Tuất', 'Hợi'],
    'Vượng địa': ['Thân', 'Tý'],
    'Đắc địa': ['Sửu', 'Mùi'],
    'Hãm địa': ['Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ'],
  },
  'Tham Lang': {
    'Miếu địa': ['Sửu', 'Mùi'],
    'Vượng địa': ['Thìn', 'Tuất'],
    'Đắc địa': ['Dần', 'Thân'],
    'Hãm địa': ['Tỵ', 'Hợi', 'Tý', 'Ngọ', 'Mão', 'Dậu'],
  },
  'Cự Môn': {
    'Miếu địa': ['Mão', 'Dậu'],
    'Vượng địa': ['Tý', 'Ngọ', 'Dần'],
    'Đắc địa': ['Thân', 'Hợi'],
    'Hãm địa': ['Thìn', 'Tuất', 'Sửu', 'Mùi', 'Tỵ'],
  },
  'Thiên Tướng': {
    'Miếu địa': ['Dần', 'Thân'],
    'Vượng địa': ['Thìn', 'Tuất', 'Tý', 'Ngọ'],
    'Đắc địa': ['Sửu', 'Mùi', 'Tỵ', 'Hợi'],
    'Hãm địa': ['Mão', 'Dậu'],
  },
  'Thiên Lương': {
    'Miếu địa': ['Ngọ', 'Thìn', 'Tuất'],
    'Vượng địa': ['Tý', 'Mão', 'Dần', 'Thân'],
    'Đắc địa': ['Sửu', 'Mùi'],
    'Hãm địa': ['Dậu', 'Tỵ', 'Hợi'],
  },
  'Thất Sát': {
    'Miếu địa': ['Dần', 'Thân', 'Tý', 'Ngọ'],
    'Vượng địa': ['Tỵ', 'Hợi'],
    'Đắc địa': ['Sửu', 'Mùi'],
    'Hãm địa': ['Mão', 'Dậu', 'Thìn', 'Tuất'],
  },
  'Phá Quân': {
    'Miếu địa': ['Tý', 'Ngọ'],
    'Vượng địa': ['Sửu', 'Mùi'],
    'Đắc địa': ['Thìn', 'Tuất'],
    'Hãm địa': ['Mão', 'Dậu', 'Dần', 'Thân', 'Tỵ', 'Hợi'],
  },
};

/** Every one of the 14 Chính Tinh, at every one of its 12 possible palace positions, always
 * resolves to exactly one dignity state — no fallback, no default (mirrors this codebase's
 * standing "impossible lookup throws" discipline). */
export function getDignity(star: ChinhTinhId, position: EarthlyBranch): DignityState {
  const row = DIGNITY_TABLE[star];
  for (const state of TU_VI_DIGNITY_STATES) {
    if (row[state]?.includes(position)) {
      return state;
    }
  }
  throw new Error(`getDignity found no dignity state for star="${star}", position="${position}" — this indicates a defect in DIGNITY_TABLE (every star's branch sets must partition all 12 branches), not a possible real outcome.`);
}

export interface ChinhTinhDignityPlacement extends ChinhTinhPlacement {
  readonly dignity: DignityState;
}

/** Annotates already-placed Chính Tinh with their dignity state — never recomputes or moves a
 * star's position, purely a lookup on top of an already-computed placement. */
export function annotateDignity(placements: ReadonlyArray<ChinhTinhPlacement>): ReadonlyArray<ChinhTinhDignityPlacement> {
  return Object.freeze(placements.map((p) => Object.freeze({ ...p, dignity: getDignity(p.star, p.position) })));
}
