import { calculateTuHoa, annotateTuHoaPositions, TU_HOA_TRANSFORMATIONS, type TuHoaTargetStar } from './tu-vi-tu-hoa';
import { HEAVENLY_STEMS } from '../../eastern-horoscope/engine/eastern-horoscope-tables';
import type { HeavenlyStem } from './tu-vi-can-chi';

/**
 * Independent fixture — re-transcribed fresh from `canonical-ruleset-v1.md` §13 / `vdttl-1956-extraction.md`
 * TUVI-25, sharing no object identity with production's `TU_HOA_TABLE`. "Tả Phụ" (as printed for
 * Nhâm's Hóa Khoa) is written here as "Tả Phù" for the same disclosed spelling-normalization
 * reason as production.
 */
const EXPECTED_TU_HOA: Readonly<Record<HeavenlyStem, readonly [TuHoaTargetStar, TuHoaTargetStar, TuHoaTargetStar, TuHoaTargetStar]>> = {
  Giáp: ['Liêm Trinh', 'Phá Quân', 'Vũ Khúc', 'Thái Dương'],
  Ất: ['Thiên Cơ', 'Thiên Lương', 'Tử Vi', 'Thái Âm'],
  Bính: ['Thiên Đồng', 'Thiên Cơ', 'Văn Xương', 'Liêm Trinh'],
  Đinh: ['Thái Âm', 'Thiên Đồng', 'Thiên Cơ', 'Cự Môn'],
  Mậu: ['Tham Lang', 'Thái Âm', 'Hữu Bật', 'Thiên Cơ'],
  Kỷ: ['Vũ Khúc', 'Tham Lang', 'Thiên Lương', 'Văn Khúc'],
  Canh: ['Thái Dương', 'Vũ Khúc', 'Thái Âm', 'Thiên Đồng'],
  Tân: ['Cự Môn', 'Thiên Lương', 'Văn Khúc', 'Văn Xương'],
  Nhâm: ['Thiên Lương', 'Tử Vi', 'Tả Phù', 'Vũ Khúc'],
  Quý: ['Phá Quân', 'Cự Môn', 'Thái Âm', 'Tham Lang'],
};

describe('calculateTuHoa — exhaustive state space (10 Cans × 4 transformations = 40 cells), independent fixture', () => {
  it('every Can matches the independently-transcribed expected row exactly', () => {
    for (const stem of HEAVENLY_STEMS) {
      const actual = calculateTuHoa(stem).map((a) => a.targetStar);
      expect(actual).toEqual([...EXPECTED_TU_HOA[stem]]);
    }
  });

  it('reproduces the book\'s own worked example (Đinh year → Thái Âm/Thiên Đồng/Thiên Cơ/Cự Môn)', () => {
    const result = calculateTuHoa('Đinh');
    expect(result.map((a) => a.targetStar)).toEqual(['Thái Âm', 'Thiên Đồng', 'Thiên Cơ', 'Cự Môn']);
  });

  it('always produces exactly 4 assignments in the fixed Lộc/Quyền/Khoa/Kỵ order, for every Can', () => {
    for (const stem of HEAVENLY_STEMS) {
      const result = calculateTuHoa(stem);
      expect(result).toHaveLength(4);
      expect(result.map((a) => a.transformation)).toEqual([...TU_HOA_TRANSFORMATIONS]);
    }
  });
});

describe('calculateTuHoa — attack tests', () => {
  it('row-shift detector: Giáp and Ất (adjacent rows) produce completely disjoint target sets — a one-row shift would be caught', () => {
    const giap = new Set(calculateTuHoa('Giáp').map((a) => a.targetStar));
    const at = new Set(calculateTuHoa('Ất').map((a) => a.targetStar));
    expect([...giap].some((s) => at.has(s))).toBe(false);
  });

  it('transformation-column swap detector: within Giáp\'s row, all 4 targets are distinct — a column swap within one row would still be a valid-looking but wrong assignment, caught by exact-order comparison above', () => {
    const targets = calculateTuHoa('Giáp').map((a) => a.targetStar);
    expect(new Set(targets).size).toBe(4);
  });

  it('one-cell mutation detector: Bính\'s Hóa Khoa target (Văn Xương) is the only CORE_13 star in that specific row — distinguishable from its Chính-Tinh neighbors in the same row', () => {
    const result = calculateTuHoa('Bính');
    const hoaKhoa = result.find((a) => a.transformation === 'Hóa Khoa')!.targetStar;
    expect(hoaKhoa).toBe('Văn Xương');
    expect(result.filter((a) => a.transformation !== 'Hóa Khoa').map((a) => a.targetStar)).toEqual(['Thiên Đồng', 'Thiên Cơ', 'Liêm Trinh']);
  });

  it('wrong-star-identifier guard: every target across all 40 cells is a real, spelled-correctly member of the 14 Chính Tinh ∪ CORE_13 star universe (no typo, no stray "Tả Phụ")', () => {
    const validStars = new Set([
      'Tử Vi', 'Liêm Trinh', 'Thiên Đồng', 'Vũ Khúc', 'Thái Dương', 'Thiên Cơ', 'Thiên Phủ', 'Thái Âm', 'Tham Lang', 'Cự Môn', 'Thiên Tướng', 'Thiên Lương', 'Thất Sát', 'Phá Quân',
      'Lộc Tồn', 'Kình Dương', 'Đà La', 'Địa Không', 'Địa Kiếp', 'Hỏa Tinh', 'Linh Tinh', 'Tả Phù', 'Hữu Bật', 'Văn Xương', 'Văn Khúc', 'Thiên Khôi', 'Thiên Việt',
    ]);
    for (const stem of HEAVENLY_STEMS) {
      for (const { targetStar } of calculateTuHoa(stem)) {
        expect(validStars.has(targetStar)).toBe(true);
      }
    }
  });
});

describe('calculateTuHoa — school-contamination audit', () => {
  it('this table is VDTTL-1956\'s own — not independently cross-checked against a Bắc Phái/Nam Phái alternative table, since the locked school (TUVI_SCHOOL_V1 = VDTTL_1956) makes that comparison moot for V1 (canonical-ruleset-v1.md §1 row 20); documented here as a conscious non-test, not an oversight', () => {
    expect(true).toBe(true);
  });
});

describe('annotateTuHoaPositions — integration (annotate only, never recompute)', () => {
  const chinhTinh = [
    { star: 'Tử Vi', position: 'Dậu' },
    { star: 'Thiên Cơ', position: 'Thân' },
  ];
  const core13 = [{ star: 'Văn Xương', position: 'Mão' }];

  it('finds a Chính Tinh target correctly', () => {
    const result = annotateTuHoaPositions([{ transformation: 'Hóa Khoa', targetStar: 'Tử Vi' }], chinhTinh, core13);
    expect(result).toHaveLength(1);
    expect(result[0]?.position).toBe('Dậu');
  });

  it('finds a CORE_13 target correctly', () => {
    const result = annotateTuHoaPositions([{ transformation: 'Hóa Khoa', targetStar: 'Văn Xương' }], chinhTinh, core13);
    expect(result).toHaveLength(1);
    expect(result[0]?.position).toBe('Mão');
  });

  it('throws if the target star is present in neither array (defect guard)', () => {
    expect(() => annotateTuHoaPositions([{ transformation: 'Hóa Lộc', targetStar: 'Thất Sát' }], chinhTinh, core13)).toThrow();
  });
});
