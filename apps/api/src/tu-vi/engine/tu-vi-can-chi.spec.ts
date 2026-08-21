import { getTuViYearCanChi } from './tu-vi-can-chi';

/**
 * SOURCE_ANCHORED_VECTOR: reuses the exact years Eastern Horoscope's own table module already
 * cites as independently cross-checked (`eastern-horoscope-tables.ts`'s own header comment) — not
 * regenerated here.
 */
describe('getTuViYearCanChi — SOURCE_ANCHORED_VECTOR: independently cross-checked years', () => {
  const knownYears: Array<[lunarYear: number, stem: string, branch: string]> = [
    [1984, 'Giáp', 'Tý'], // the sexagenary-cycle anchor itself
    [1986, 'Bính', 'Dần'],
    [2013, 'Quý', 'Tỵ'],
    [2023, 'Quý', 'Mão'],
    [2024, 'Giáp', 'Thìn'],
  ];

  it.each(knownYears)('lunar year %i is %s %s', (lunarYear, stem, branch) => {
    const result = getTuViYearCanChi(lunarYear);
    expect(result).toEqual({ lunarYear, stem, branch });
  });
});

describe('getTuViYearCanChi — Lunar New Year boundary (year Can Chi must use the LUNAR year, never the Gregorian year)', () => {
  it('2024-02-09 (the day before Tết 2024) is still lunar year 2023 → Quý Mão', () => {
    // lunarYear itself comes from the calendar layer (tu-vi-calendar.adapter.ts), already tested
    // there for this exact boundary — here we only confirm the Can-Chi lookup for that year.
    expect(getTuViYearCanChi(2023)).toEqual({ lunarYear: 2023, stem: 'Quý', branch: 'Mão' });
  });

  it('2024-02-10 (Tết 2024 itself) is lunar year 2024 → Giáp Thìn — a different Can AND a different Chi than the day before, proving the boundary is not accidentally smoothed over', () => {
    const before = getTuViYearCanChi(2023);
    const onOrAfter = getTuViYearCanChi(2024);
    expect(before).not.toEqual(onOrAfter);
    expect(onOrAfter).toEqual({ lunarYear: 2024, stem: 'Giáp', branch: 'Thìn' });
  });
});

describe('getTuViYearCanChi — sexagenary-cycle wraparound', () => {
  it('produces a valid Can/Chi pair for years far from the 1984 anchor in both directions', () => {
    const heavenlyStems = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'];
    const earthlyBranches = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];
    for (const year of [1900, 1950, 1984, 2000, 2050, 2100]) {
      const result = getTuViYearCanChi(year);
      expect(heavenlyStems).toContain(result.stem);
      expect(earthlyBranches).toContain(result.branch);
    }
  });

  it('the 60-year cycle repeats exactly (1984 and 2044 are both Giáp Tý — same stem/branch, different lunarYear)', () => {
    const y1984 = getTuViYearCanChi(1984);
    const y2044 = getTuViYearCanChi(2044);
    expect({ stem: y1984.stem, branch: y1984.branch }).toEqual({ stem: y2044.stem, branch: y2044.branch });
  });
});
