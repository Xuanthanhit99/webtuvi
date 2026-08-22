import { STEM_ELEMENT } from '../../eastern-horoscope/engine/eastern-horoscope-tables';
import { addPalaceOffset, PALACE_ROLES_FROM_MENH, type EarthlyBranch, type PalaceRole } from './tu-vi-palace';
import { TU_VI_CUC_NUMBER, type TuViCucId } from './tu-vi-cuc';
import type { HeavenlyStem } from './tu-vi-can-chi';
import type { TuViSex } from './tu-vi-canonical-input';

/**
 * Đại Vận (Đại Hạn) — the 10-year life-cycle system. Source: VDTTL-1956 dv01, "10. KHỞI HẠN, 10.1.
 * Đại hạn (10 năm)" (p.20), independently re-read directly against the PDF page-image scan (not
 * OCR text alone), cross-checked against 3 separate worked examples spanning 2 different pages
 * (p.20's own "Dương nam, Hỏa Lục Cục" example; p.21/22's two "cung gốc của đại hạn" ranges cited
 * inside the unrelated Lưu Đại Hạn worked examples — "23 tuổi đến 32 tuổi" for Dương Nam Mộc Tam
 * Cục, "34 tuổi đến 43 tuổi" for Âm Nam Kim Tứ Cục — both independently consistent with the formula
 * below, not merely the one example used to derive it).
 *
 * Rule, verbatim: "Bắt đầu ghi số Cục ở cung an Mệnh, đoạn dương nam, âm nữ theo chiều thuận, âm
 * nam, dương nữ theo chiều nghịch, lần lượt ghi số tiếp theo, từ cung này chuyển sang cung khác phải
 * cộng thêm mười." The book separately describes and then explicitly deprioritizes a second, less
 * common method ("Nhưng thường người ta hay dùng cách thứ nhất vì nó chính xác hơn" — "the first
 * method is usually used because it is more accurate") — only the first (Mệnh-starting) method is
 * implemented here, matching the book's own stated preference, not an engineering guess.
 *
 * "Thuận"/"nghịch" here walk the already-proven-correct `PALACE_ROLES_FROM_MENH` role order
 * (`tu-vi-palace.ts` — independently established via a mathematical invariant on the Thân offset,
 * predating and confirming this Đại Hạn rule rather than the other way around: the book's own p.20
 * worked example, "6 ở cung Mệnh, rồi... 16 ở cung Phụ Mẫu, 26 ở cung Phúc Đức", matches
 * `PALACE_ROLES_FROM_MENH`'s offsets 0/1/2 exactly). No separate direction table is introduced here.
 *
 * Explicitly OUT OF SCOPE (not implemented): "Lưu Đại Hạn" (p.20–21, §10.2 — an annual sub-cycle
 * within each 10-year Đại Hạn window, computed via a "xung chiếu"/opposite-palace pivot) — a real,
 * separately-verified mechanism, deferred to a future phase; only the core 10-year palace/age
 * assignment is implemented here.
 */

export interface DaiVanCycle {
  readonly index: number;
  readonly ageStart: number;
  readonly ageEnd: number;
  readonly role: PalaceRole;
  readonly position: EarthlyBranch;
}

export interface CalculateDaiVanInput {
  menhPosition: EarthlyBranch;
  cuc: TuViCucId;
  sex: TuViSex;
  yearStem: HeavenlyStem;
}

/** Whether the walk is "thuận" (forward through `PALACE_ROLES_FROM_MENH`) — true for dương nam or
 * âm nữ, false (nghịch) for âm nam or dương nữ. Reuses the exact same Can-yin-yang × sex boolean
 * shape already established for CORE_13's Hỏa Tinh/Linh Tinh (`tu-vi-core13.ts`), not a new pattern. */
function isThuan(sex: TuViSex, yearStem: HeavenlyStem): boolean {
  const isYearCanDuong = STEM_ELEMENT[yearStem].yinYang === 'Dương';
  return isYearCanDuong === (sex === 'Nam');
}

/**
 * All 12 Đại Hạn decade-cycles (ages up to `cucNumber + 119`, covering any realistic lifetime),
 * in chronological order. `index` is 0 at Mệnh, increasing outward in the walk direction.
 */
export function calculateDaiVan({ menhPosition, cuc, sex, yearStem }: CalculateDaiVanInput): ReadonlyArray<DaiVanCycle> {
  const cucNumber = TU_VI_CUC_NUMBER[cuc];
  const thuan = isThuan(sex, yearStem);

  const cycles: DaiVanCycle[] = [];
  for (let index = 0; index < 12; index++) {
    const offset = thuan ? index : -index;
    const roleIndex = thuan ? index : (12 - index) % 12;
    const ageStart = cucNumber + index * 10;
    cycles.push(
      Object.freeze({
        index,
        ageStart,
        ageEnd: ageStart + 9,
        role: PALACE_ROLES_FROM_MENH[roleIndex]!,
        position: addPalaceOffset(menhPosition, offset),
      }),
    );
  }
  return Object.freeze(cycles);
}
