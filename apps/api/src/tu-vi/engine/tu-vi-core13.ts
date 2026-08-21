import { EARTHLY_BRANCHES, getPalaceIndex, addPalaceOffset, type EarthlyBranch } from './tu-vi-palace';
import { STEM_ELEMENT } from '../../eastern-horoscope/engine/eastern-horoscope-tables';
import type { HeavenlyStem } from './tu-vi-can-chi';
import type { TuViSex } from './tu-vi-canonical-input';

/**
 * Sprint 18B.5 — `TUVI_AUXILIARY_STAR_SCOPE_V1 = CORE_13` (`canonical-ruleset-v1.md` §7,
 * founder-locked Sprint 18A.6). Exactly these 13 stars, no more, no fewer:
 * Lộc Tồn, Kình Dương, Đà La, Địa Không, Địa Kiếp, Hỏa Tinh, Linh Tinh, Tả Phù, Hữu Bật,
 * Văn Xương, Văn Khúc, Thiên Khôi, Thiên Việt (`canonical-ruleset-v1.md` §1 rows 21–27).
 *
 * Every counting-based rule below (all except Lộc Tồn and Thiên Khôi/Việt, which are direct table
 * lookups) uses the same mechanic already established for Mệnh/Thân: `start palace ± targetIndex0
 * (mod 12)`, where the start palace is verbally "labeled giờ Tý / tháng Giêng" and target0 is the
 * target's own standard 0-indexed position — re-verified this sprint directly against VDTTL-1956
 * pp.9–11 (5× zoom), all phrased with the identical "Bắt đầu từ cung X, kể là [giờ Tý/tháng
 * Giêng], đếm theo chiều thuận/nghịch đến [target], ngừng lại ở cung nào an ... ở cung đó"
 * structure as Mệnh/Thân's own rule.
 */

export const TU_VI_CORE13_STAR_IDS = [
  'Lộc Tồn',
  'Kình Dương',
  'Đà La',
  'Địa Không',
  'Địa Kiếp',
  'Hỏa Tinh',
  'Linh Tinh',
  'Tả Phù',
  'Hữu Bật',
  'Văn Xương',
  'Văn Khúc',
  'Thiên Khôi',
  'Thiên Việt',
] as const;

export type Core13StarId = (typeof TU_VI_CORE13_STAR_IDS)[number];

export class Core13InputError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'Core13InputError';
  }
}

/** TUVI-AUX-LOCTON — year-Can, 10-cell table. VDTTL-1956 p.9. */
const LOC_TON_TABLE: Readonly<Record<HeavenlyStem, EarthlyBranch>> = {
  Giáp: 'Dần',
  Ất: 'Mão',
  Bính: 'Tỵ',
  Đinh: 'Ngọ',
  Mậu: 'Tỵ',
  Kỷ: 'Ngọ',
  Canh: 'Thân',
  Tân: 'Dậu',
  Nhâm: 'Hợi',
  Quý: 'Tý',
};

/** TUVI-AUX-KHOIVIET — year-Can, 10-cell table. VDTTL-1956 p.11, cross-checked against its own
 * worked example (Ất Mùi → Khôi Tý, Việt Thân). */
const KHOI_VIET_TABLE: Readonly<Record<HeavenlyStem, { khoi: EarthlyBranch; viet: EarthlyBranch }>> = {
  Giáp: { khoi: 'Sửu', viet: 'Mùi' },
  Mậu: { khoi: 'Sửu', viet: 'Mùi' },
  Ất: { khoi: 'Tý', viet: 'Thân' },
  Kỷ: { khoi: 'Tý', viet: 'Thân' },
  Canh: { khoi: 'Ngọ', viet: 'Dần' },
  Tân: { khoi: 'Ngọ', viet: 'Dần' },
  Bính: { khoi: 'Hợi', viet: 'Dậu' },
  Đinh: { khoi: 'Hợi', viet: 'Dậu' },
  Nhâm: { khoi: 'Mão', viet: 'Tỵ' },
  Quý: { khoi: 'Mão', viet: 'Tỵ' },
};

/** TUVI-AUX-HOALINH — year-Chi trine-group → starting palace, VDTTL-1956 p.11. 4 groups of 3
 * branches each (the classic tam-hợp/trine sets), re-verified at 5× zoom Sprint 18A.6. */
const HOA_LINH_START_BY_YEAR_CHI: Readonly<Record<EarthlyBranch, { hoaTinhStart: EarthlyBranch; linhTinhStart: EarthlyBranch }>> = {
  Dần: { hoaTinhStart: 'Sửu', linhTinhStart: 'Mão' },
  Ngọ: { hoaTinhStart: 'Sửu', linhTinhStart: 'Mão' },
  Tuất: { hoaTinhStart: 'Sửu', linhTinhStart: 'Mão' },
  Tỵ: { hoaTinhStart: 'Mão', linhTinhStart: 'Tuất' },
  Dậu: { hoaTinhStart: 'Mão', linhTinhStart: 'Tuất' },
  Sửu: { hoaTinhStart: 'Mão', linhTinhStart: 'Tuất' },
  Thân: { hoaTinhStart: 'Dần', linhTinhStart: 'Tuất' },
  Tý: { hoaTinhStart: 'Dần', linhTinhStart: 'Tuất' },
  Thìn: { hoaTinhStart: 'Dần', linhTinhStart: 'Tuất' },
  Hợi: { hoaTinhStart: 'Dần', linhTinhStart: 'Tuất' },
  Mão: { hoaTinhStart: 'Dần', linhTinhStart: 'Tuất' },
  Mùi: { hoaTinhStart: 'Dần', linhTinhStart: 'Tuất' },
};

function mod12(n: number): number {
  return ((n % 12) + 12) % 12;
}

function hourIndex0(hourBranch: EarthlyBranch): number {
  return getPalaceIndex(hourBranch);
}

export interface CalculateCore13Input {
  yearStem: HeavenlyStem;
  yearChi: EarthlyBranch;
  lunarMonth: number;
  hourBranch: EarthlyBranch;
  /** Required only because Hỏa Tinh/Linh Tinh's direction is genuinely sex-dependent
   * (VDTTL-1956 p.10, §8.6.3 — both parity cases directly confirmed this sprint, not inferred from
   * general convention). Throws `Core13InputError` (`TUVI_CORE13_SEX_REQUIRED`) if omitted. */
  sex: TuViSex;
}

export interface Core13Placement {
  readonly star: Core13StarId;
  readonly position: EarthlyBranch;
}

export function calculateCore13Stars({ yearStem, yearChi, lunarMonth, hourBranch, sex }: CalculateCore13Input): ReadonlyArray<Core13Placement> {
  if (!Number.isInteger(lunarMonth) || lunarMonth < 1 || lunarMonth > 12) {
    throw new RangeError(`lunarMonth must be an integer 1–12, got ${lunarMonth}`);
  }
  if (sex !== 'Nam' && sex !== 'Nữ') {
    throw new Core13InputError('calculateCore13Stars requires sex ("Nam" or "Nữ") — Hỏa Tinh/Linh Tinh cannot be placed without it.', 'TUVI_CORE13_SEX_REQUIRED');
  }

  const month0 = lunarMonth - 1;
  const hour0 = hourIndex0(hourBranch);

  // Lộc Tồn (table) + Kình Dương/Đà La (±1 from Lộc Tồn).
  const locTon = LOC_TON_TABLE[yearStem];
  const kinhDuong = addPalaceOffset(locTon, 1);
  const daLa = addPalaceOffset(locTon, -1);

  // Địa Kiếp (thuận/forward from Hợi) / Địa Không (nghịch/backward from Hợi).
  const diaKiep = addPalaceOffset('Hợi', hour0);
  const diaKhong = addPalaceOffset('Hợi', -hour0);

  // Hỏa Tinh / Linh Tinh: starting palace by year-Chi trine group, direction by sex × year-Can
  // yin-yang parity. Group A ("dương nam, âm nữ"): Hỏa Tinh thuận, Linh Tinh nghịch. Group B ("âm
  // nam, dương nữ"): reversed. STEM_ELEMENT reused from Eastern Horoscope's table module — pure,
  // non-disputed Can→yin-yang data, not duplicated a second time.
  const { hoaTinhStart, linhTinhStart } = HOA_LINH_START_BY_YEAR_CHI[yearChi];
  const isYearCanDuong = STEM_ELEMENT[yearStem].yinYang === 'Dương';
  const isGroupA = isYearCanDuong === (sex === 'Nam'); // dương+nam or âm+nữ
  const hoaTinh = addPalaceOffset(hoaTinhStart, isGroupA ? hour0 : -hour0);
  const linhTinh = addPalaceOffset(linhTinhStart, isGroupA ? -hour0 : hour0);

  // Tả Phù (thuận from Thìn, by month) / Hữu Bật (nghịch from Tuất, by month).
  const taPhu = addPalaceOffset('Thìn', month0);
  const huuBat = addPalaceOffset('Tuất', -month0);

  // Văn Xương (nghịch from Tuất, by hour) / Văn Khúc (thuận from Thìn, by hour).
  const vanXuong = addPalaceOffset('Tuất', -hour0);
  const vanKhuc = addPalaceOffset('Thìn', hour0);

  // Thiên Khôi / Thiên Việt (table).
  const { khoi, viet } = KHOI_VIET_TABLE[yearStem];

  const positions: Readonly<Record<Core13StarId, EarthlyBranch>> = {
    'Lộc Tồn': locTon,
    'Kình Dương': kinhDuong,
    'Đà La': daLa,
    'Địa Không': diaKhong,
    'Địa Kiếp': diaKiep,
    'Hỏa Tinh': hoaTinh,
    'Linh Tinh': linhTinh,
    'Tả Phù': taPhu,
    'Hữu Bật': huuBat,
    'Văn Xương': vanXuong,
    'Văn Khúc': vanKhuc,
    'Thiên Khôi': khoi,
    'Thiên Việt': viet,
  };

  return Object.freeze(TU_VI_CORE13_STAR_IDS.map((star) => Object.freeze({ star, position: positions[star] })));
}

export { EARTHLY_BRANCHES, mod12 };
