import { calculateDaiVan } from './tu-vi-dai-van';
import { calculateTieuHanStart, getTieuHanPalace } from './tu-vi-tieu-han';
import { calculateTuoi, getCurrentLunarYear, findCurrentDaiVan, findCurrentTieuHan, findNearbyTieuHan } from './tu-vi-current-cycle';

describe('calculateTuoi', () => {
  it('birth year itself is tuổi 1 (Vietnamese nominal age)', () => {
    expect(calculateTuoi(1990, 1990)).toBe(1);
  });

  it('the following lunar year is tuổi 2', () => {
    expect(calculateTuoi(1990, 1991)).toBe(2);
  });

  it('a multi-year gap accumulates correctly (born 1990, 2013 => tuổi 24)', () => {
    expect(calculateTuoi(1990, 2013)).toBe(24);
  });
});

describe('getCurrentLunarYear', () => {
  it('resolves a real Gregorian date to a real lunar year (sanity check against a known anchor)', () => {
    // 2024-02-10 is within the Giáp Thìn lunar year (Tết 2024 fell on 2024-02-10 itself).
    expect(getCurrentLunarYear(new Date('2024-02-15T00:00:00Z'))).toBe(2024);
  });
});

describe('findCurrentDaiVan', () => {
  const cycles = calculateDaiVan({ menhPosition: 'Dần', cuc: 'Hỏa Lục Cục', sex: 'Nam', yearStem: 'Giáp' });

  it('finds the cycle containing a mid-range tuổi', () => {
    expect(findCurrentDaiVan(cycles, 20)!.index).toBe(1); // 16-25
  });

  it('is inclusive at both boundary ages', () => {
    expect(findCurrentDaiVan(cycles, 6)!.index).toBe(0); // exact start
    expect(findCurrentDaiVan(cycles, 15)!.index).toBe(0); // exact end
    expect(findCurrentDaiVan(cycles, 16)!.index).toBe(1); // one after boundary
  });

  it('returns null before the first cycle starts (a child younger than the Cục starting age)', () => {
    expect(findCurrentDaiVan(cycles, 1)).toBeNull();
    expect(findCurrentDaiVan(cycles, 5)).toBeNull(); // Hỏa Lục Cục starts at 6
  });

  it('returns null past the last computed cycle (should not happen for any realistic age, handled explicitly anyway)', () => {
    expect(findCurrentDaiVan(cycles, 200)).toBeNull();
  });
});

describe('findCurrentTieuHan', () => {
  const start = calculateTieuHanStart({ yearBranch: 'Tý', sex: 'Nam' });
  const BIRTH_LUNAR_YEAR = 2000;

  it('resolves the correct palace for a supported adult age, matching getTieuHanPalace directly', () => {
    const result = findCurrentTieuHan(start, 15, BIRTH_LUNAR_YEAR);
    expect(result).toEqual({ tuoi: 15, lunarYear: 2014, palace: 'Tý' }); // age13->Tuất,14->Hợi,15->Tý (thuận)
  });

  it('returns null for the unimplemented child system (tuổi < 13), one year before the boundary', () => {
    expect(findCurrentTieuHan(start, 12, BIRTH_LUNAR_YEAR)).toBeNull();
  });

  it('resolves correctly exactly at the boundary (tuổi 13)', () => {
    expect(findCurrentTieuHan(start, 13, BIRTH_LUNAR_YEAR)).toEqual({ tuoi: 13, lunarYear: 2012, palace: 'Tuất' });
  });

  it('lunarYear tracks tuổi 1 back to the birth lunar year itself', () => {
    expect(findCurrentTieuHan(start, 1, BIRTH_LUNAR_YEAR)?.lunarYear ?? BIRTH_LUNAR_YEAR).toBe(BIRTH_LUNAR_YEAR);
  });
});

describe('findNearbyTieuHan', () => {
  const start = calculateTieuHanStart({ yearBranch: 'Tý', sex: 'Nam' });
  const BIRTH_LUNAR_YEAR = 2000;

  it('returns a full 2*radius+1 window matching getTieuHanPalace exactly for each year, well away from the child-age boundary', () => {
    const nearby = findNearbyTieuHan(start, 20, BIRTH_LUNAR_YEAR, 2);
    expect(nearby.map((e) => e.tuoi)).toEqual([18, 19, 20, 21, 22]);
    for (const entry of nearby) {
      expect(entry.palace).toBe(getTieuHanPalace(start, entry.tuoi));
      expect(entry.lunarYear).toBe(BIRTH_LUNAR_YEAR + entry.tuoi - 1);
    }
  });

  it('silently omits years below tuổi 13 rather than fabricating a child-system result', () => {
    const nearby = findNearbyTieuHan(start, 13, BIRTH_LUNAR_YEAR, 2); // would-be window: 11,12,13,14,15
    expect(nearby.map((e) => e.tuoi)).toEqual([13, 14, 15]);
  });

  it('defaults to radius 2 (5 years) when unspecified', () => {
    expect(findNearbyTieuHan(start, 30, BIRTH_LUNAR_YEAR)).toHaveLength(5);
  });
});
