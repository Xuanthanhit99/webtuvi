import { calculateCore13Stars, Core13InputError, TU_VI_CORE13_STAR_IDS } from './tu-vi-core13';
import { EARTHLY_BRANCHES } from './tu-vi-palace';
import type { HeavenlyStem } from './tu-vi-can-chi';

const HEAVENLY_STEMS: readonly HeavenlyStem[] = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'];

/**
 * Dependency audit (Phase 6 of the governing task). Every row confirms
 * DEFERRED-STAR DEPENDENCY = NO — no CORE_13 star requires any of the ~40 deferred stars
 * (Thái Tuế series, Tràng Sinh series, Lộc Tồn's own companion walk, etc.).
 *
 * | STAR         | INPUTS                        | UPSTREAM CONTEXT                  | RULE_ID              | DEFERRED-STAR DEPENDENCY |
 * |--------------|--------------------------------|------------------------------------|-----------------------|---------------------------|
 * | Lộc Tồn      | yearStem                       | TuViFoundationContext.yearCanChi   | TUVI-AUX-LOCTON       | NO |
 * | Kình Dương   | Lộc Tồn's own position         | (computed above, same call)        | TUVI-AUX-KINHDA       | NO (depends on Lộc Tồn, itself CORE_13) |
 * | Đà La        | Lộc Tồn's own position         | (computed above, same call)        | TUVI-AUX-KINHDA       | NO |
 * | Địa Kiếp     | hourBranch                     | TuViCalendarContext.hourBranch     | TUVI-AUX-DIAKHONGKIEP | NO |
 * | Địa Không    | hourBranch                     | TuViCalendarContext.hourBranch     | TUVI-AUX-DIAKHONGKIEP | NO |
 * | Hỏa Tinh     | yearChi, yearStem(yin-yang), sex, hourBranch | yearCanChi + calendar + input | TUVI-AUX-HOALINH | NO |
 * | Linh Tinh    | yearChi, yearStem(yin-yang), sex, hourBranch | yearCanChi + calendar + input | TUVI-AUX-HOALINH | NO |
 * | Tả Phù       | lunarMonth                     | TuViCalendarContext.lunarDate      | TUVI-AUX-TAPHUUBAT    | NO |
 * | Hữu Bật      | lunarMonth                     | TuViCalendarContext.lunarDate      | TUVI-AUX-TAPHUUBAT    | NO |
 * | Văn Xương    | hourBranch                     | TuViCalendarContext.hourBranch     | TUVI-AUX-VANXUONGKHUC | NO |
 * | Văn Khúc     | hourBranch                     | TuViCalendarContext.hourBranch     | TUVI-AUX-VANXUONGKHUC | NO |
 * | Thiên Khôi   | yearStem                       | TuViFoundationContext.yearCanChi   | TUVI-AUX-KHOIVIET     | NO |
 * | Thiên Việt   | yearStem                       | TuViFoundationContext.yearCanChi   | TUVI-AUX-KHOIVIET     | NO |
 */
describe('CORE_13 dependency audit — structural confirmation', () => {
  it('produces exactly the 13 founder-locked star IDs, no more, no fewer', () => {
    expect(TU_VI_CORE13_STAR_IDS).toHaveLength(13);
  });
});

describe('calculateCore13Stars — VECTOR-derived regression (Giáp year, tháng 1, giờ Tý, Nam — trivial 0-offset case)', () => {
  it('table-lookup stars: Lộc Tồn=Dần, Kình Dương=Mão, Đà La=Sửu, Thiên Khôi=Sửu, Thiên Việt=Mùi', () => {
    const placements = calculateCore13Stars({ yearStem: 'Giáp', yearChi: 'Tý', lunarMonth: 1, hourBranch: 'Tý', sex: 'Nam' });
    const byStar = Object.fromEntries(placements.map((p) => [p.star, p.position]));
    expect(byStar['Lộc Tồn']).toBe('Dần');
    expect(byStar['Kình Dương']).toBe('Mão');
    expect(byStar['Đà La']).toBe('Sửu');
    expect(byStar['Thiên Khôi']).toBe('Sửu');
    expect(byStar['Thiên Việt']).toBe('Mùi');
  });

  it('month/hour-counted stars at 0 offset resolve to their bare starting palace: Tả Phù=Thìn, Hữu Bật=Tuất, Văn Xương=Tuất, Văn Khúc=Thìn, Địa Kiếp=Hợi, Địa Không=Hợi', () => {
    const placements = calculateCore13Stars({ yearStem: 'Giáp', yearChi: 'Tý', lunarMonth: 1, hourBranch: 'Tý', sex: 'Nam' });
    const byStar = Object.fromEntries(placements.map((p) => [p.star, p.position]));
    expect(byStar['Tả Phù']).toBe('Thìn');
    expect(byStar['Hữu Bật']).toBe('Tuất');
    expect(byStar['Văn Xương']).toBe('Tuất');
    expect(byStar['Văn Khúc']).toBe('Thìn');
    expect(byStar['Địa Kiếp']).toBe('Hợi');
    expect(byStar['Địa Không']).toBe('Hợi');
  });

  it('Hỏa Tinh/Linh Tinh, Group A (dương năm Giáp + Nam): year-Chi Tý → group Thân,Tý,Thìn → start Dần/Tuất; at 0 hour-offset, both equal their bare start palace', () => {
    const placements = calculateCore13Stars({ yearStem: 'Giáp', yearChi: 'Tý', lunarMonth: 1, hourBranch: 'Tý', sex: 'Nam' });
    const byStar = Object.fromEntries(placements.map((p) => [p.star, p.position]));
    expect(byStar['Hỏa Tinh']).toBe('Dần');
    expect(byStar['Linh Tinh']).toBe('Tuất');
  });
});

describe('calculateCore13Stars — VECTOR-B4-consistent regression (Canh Ngọ year, tháng 8, giờ Mùi, Nữ)', () => {
  const input = { yearStem: 'Canh' as const, yearChi: 'Ngọ' as const, lunarMonth: 8, hourBranch: 'Mùi' as const, sex: 'Nữ' as const };

  it('matches golden-vector-v2-spec.md VECTOR-B4\'s already-hand-verified values exactly', () => {
    const placements = calculateCore13Stars(input);
    const byStar = Object.fromEntries(placements.map((p) => [p.star, p.position]));
    expect(byStar['Lộc Tồn']).toBe('Thân');
    expect(byStar['Kình Dương']).toBe('Dậu');
    expect(byStar['Đà La']).toBe('Mùi');
    expect(byStar['Thiên Khôi']).toBe('Ngọ');
    expect(byStar['Thiên Việt']).toBe('Dần');
    expect(byStar['Tả Phù']).toBe('Hợi');
    expect(byStar['Hữu Bật']).toBe('Mão');
    expect(byStar['Văn Xương']).toBe('Mão');
    expect(byStar['Văn Khúc']).toBe('Hợi');
    expect(byStar['Địa Kiếp']).toBe('Ngọ');
    expect(byStar['Địa Không']).toBe('Thìn');
  });

  it('Hỏa Tinh/Linh Tinh, Group B (dương Can Canh + Nữ = opposite parity): year-Chi Ngọ → group Dần,Ngọ,Tuất → start Sửu/Mão; Group B reverses the Group-A direction', () => {
    // Group B: Hỏa Tinh nghịch (Sửu[1] − hour0[7] = −6 mod 12 = 6 = Ngọ); Linh Tinh thuận
    // (Mão[3] + hour0[7] = 10 = Tuất) — freshly derived this sprint, not previously computed.
    const placements = calculateCore13Stars(input);
    const byStar = Object.fromEntries(placements.map((p) => [p.star, p.position]));
    expect(byStar['Hỏa Tinh']).toBe('Ngọ');
    expect(byStar['Linh Tinh']).toBe('Tuất');
  });
});

describe('calculateCore13Stars — Hỏa Tinh/Linh Tinh parity switch (same year/month/hour, only sex differs)', () => {
  it('flips both stars\' resulting palace when sex flips (Group A ↔ Group B), for an hour where the flip is visible', () => {
    // NOT giờ Tý (hour0=0, no offset at all) or giờ Ngọ (hour0=6, self-inverse mod 12: +6≡−6, so
    // the parity flip has zero visible effect there — this test's first draft used Ngọ and failed
    // for exactly that reason, a TEST_DEFECT caught and fixed, not a product defect).
    const base = { yearStem: 'Giáp' as const, yearChi: 'Tý' as const, lunarMonth: 1, hourBranch: 'Mão' as const };
    const asNam = calculateCore13Stars({ ...base, sex: 'Nam' });
    const asNu = calculateCore13Stars({ ...base, sex: 'Nữ' });
    const hoaNam = asNam.find((p) => p.star === 'Hỏa Tinh')!.position;
    const hoaNu = asNu.find((p) => p.star === 'Hỏa Tinh')!.position;
    const linhNam = asNam.find((p) => p.star === 'Linh Tinh')!.position;
    const linhNu = asNu.find((p) => p.star === 'Linh Tinh')!.position;
    expect(hoaNam).not.toBe(hoaNu);
    expect(linhNam).not.toBe(linhNu);
    // every other star must be completely unaffected by the sex flip
    expect(asNam.filter((p) => p.star !== 'Hỏa Tinh' && p.star !== 'Linh Tinh')).toEqual(asNu.filter((p) => p.star !== 'Hỏa Tinh' && p.star !== 'Linh Tinh'));
  });
});

describe('calculateCore13Stars — table boundary: all 10 year Cans (Lộc Tồn, Thiên Khôi/Việt)', () => {
  it.each(HEAVENLY_STEMS)('yearStem=%s produces a valid Lộc Tồn/Kình Dương/Đà La/Thiên Khôi/Thiên Việt', (yearStem) => {
    const placements = calculateCore13Stars({ yearStem, yearChi: 'Tý', lunarMonth: 1, hourBranch: 'Tý', sex: 'Nam' });
    for (const starName of ['Lộc Tồn', 'Kình Dương', 'Đà La', 'Thiên Khôi', 'Thiên Việt']) {
      const position = placements.find((p) => p.star === starName)!.position;
      expect(EARTHLY_BRANCHES).toContain(position);
    }
  });

  it('Kình Dương/Đà La stay correctly offset (+1/−1) from Lộc Tồn for every year Can', () => {
    for (const yearStem of HEAVENLY_STEMS) {
      const placements = calculateCore13Stars({ yearStem, yearChi: 'Tý', lunarMonth: 1, hourBranch: 'Tý', sex: 'Nam' });
      const byStar = Object.fromEntries(placements.map((p) => [p.star, p.position]));
      const locTonIdx = EARTHLY_BRANCHES.indexOf(byStar['Lộc Tồn']!);
      expect(byStar['Kình Dương']).toBe(EARTHLY_BRANCHES[(locTonIdx + 1) % 12]);
      expect(byStar['Đà La']).toBe(EARTHLY_BRANCHES[(locTonIdx + 11) % 12]);
    }
  });
});

describe('calculateCore13Stars — table boundary: all 12 year Chis (Hỏa Tinh/Linh Tinh trine groups)', () => {
  it.each(EARTHLY_BRANCHES)('yearChi=%s produces a valid Hỏa Tinh/Linh Tinh starting configuration', (yearChi) => {
    const placements = calculateCore13Stars({ yearStem: 'Giáp', yearChi, lunarMonth: 1, hourBranch: 'Tý', sex: 'Nam' });
    for (const starName of ['Hỏa Tinh', 'Linh Tinh']) {
      const position = placements.find((p) => p.star === starName)!.position;
      expect(EARTHLY_BRANCHES).toContain(position);
    }
  });
});

describe('calculateCore13Stars — wraparound (all 12 hour branches, all 12 lunar months)', () => {
  it('every hour branch produces valid Địa Không/Kiếp/Văn Xương/Văn Khúc positions, no out-of-range index', () => {
    for (const hourBranch of EARTHLY_BRANCHES) {
      const placements = calculateCore13Stars({ yearStem: 'Giáp', yearChi: 'Tý', lunarMonth: 1, hourBranch, sex: 'Nam' });
      for (const starName of ['Địa Không', 'Địa Kiếp', 'Văn Xương', 'Văn Khúc']) {
        expect(EARTHLY_BRANCHES).toContain(placements.find((p) => p.star === starName)!.position);
      }
    }
  });

  it('every lunar month produces valid Tả Phù/Hữu Bật positions', () => {
    for (let lunarMonth = 1; lunarMonth <= 12; lunarMonth++) {
      const placements = calculateCore13Stars({ yearStem: 'Giáp', yearChi: 'Tý', lunarMonth, hourBranch: 'Tý', sex: 'Nam' });
      for (const starName of ['Tả Phù', 'Hữu Bật']) {
        expect(EARTHLY_BRANCHES).toContain(placements.find((p) => p.star === starName)!.position);
      }
    }
  });
});

describe('calculateCore13Stars — structural invariants', () => {
  it('produces exactly 13 entries, unique star IDs, stable canonical order', () => {
    const placements = calculateCore13Stars({ yearStem: 'Giáp', yearChi: 'Tý', lunarMonth: 1, hourBranch: 'Tý', sex: 'Nam' });
    expect(placements).toHaveLength(13);
    expect(placements.map((p) => p.star)).toEqual([...TU_VI_CORE13_STAR_IDS]);
    expect(new Set(placements.map((p) => p.star)).size).toBe(13);
  });

  it('the result is frozen (immutable), including each entry', () => {
    const placements = calculateCore13Stars({ yearStem: 'Giáp', yearChi: 'Tý', lunarMonth: 1, hourBranch: 'Tý', sex: 'Nam' });
    expect(Object.isFrozen(placements)).toBe(true);
    expect(Object.isFrozen(placements[0])).toBe(true);
  });
});

describe('calculateCore13Stars — invalid input', () => {
  it('throws Core13InputError when sex is missing/invalid', () => {
    expect(() => calculateCore13Stars({ yearStem: 'Giáp', yearChi: 'Tý', lunarMonth: 1, hourBranch: 'Tý', sex: undefined as unknown as 'Nam' })).toThrow(Core13InputError);
  });

  it('rejects an out-of-range lunar month', () => {
    expect(() => calculateCore13Stars({ yearStem: 'Giáp', yearChi: 'Tý', lunarMonth: 13, hourBranch: 'Tý', sex: 'Nam' })).toThrow(RangeError);
  });
});

describe('calculateCore13Stars — determinism', () => {
  it('repeated calls with identical input produce byte-identical output', () => {
    const input = { yearStem: 'Đinh' as const, yearChi: 'Sửu' as const, lunarMonth: 9, hourBranch: 'Mão' as const, sex: 'Nữ' as const };
    const first = calculateCore13Stars(input);
    for (let i = 0; i < 5; i++) {
      expect(calculateCore13Stars(input)).toEqual(first);
    }
  });
});
