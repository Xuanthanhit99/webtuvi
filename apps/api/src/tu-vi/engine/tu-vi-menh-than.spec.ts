import { calculateMenhPalace, calculateThanPalace, isValidThanOffset, ALLOWED_THAN_OFFSETS_FROM_MENH } from './tu-vi-menh-than';
import { EARTHLY_BRANCHES, getPalaceIndex } from './tu-vi-palace';

describe('calculateMenhPalace / calculateThanPalace — baseline structural cases', () => {
  it('tháng Giêng (1), giờ Tý → Mệnh = Thân = Dần (the simplest case: 0 steps either direction)', () => {
    expect(calculateMenhPalace({ lunarMonth: 1, hourBranch: 'Tý' })).toBe('Dần');
    expect(calculateThanPalace({ lunarMonth: 1, hourBranch: 'Tý' })).toBe('Dần');
  });

  it('a manually-traced non-trivial case: tháng 3, giờ Dần → R=Thìn, Mệnh=Dần, Thân=Ngọ', () => {
    // R0 = (3+1) mod 12 = 4 = Thìn. giờ0(Dần) = 2. Mệnh0 = (4-2) mod12 = 2 = Dần. Thân0 = (4+2) mod12 = 6 = Ngọ.
    expect(calculateMenhPalace({ lunarMonth: 3, hourBranch: 'Dần' })).toBe('Dần');
    expect(calculateThanPalace({ lunarMonth: 3, hourBranch: 'Dần' })).toBe('Ngọ');
  });
});

describe('calculateMenhPalace / calculateThanPalace — Tý and Ngọ are the only hours that always coincide (canonical-ruleset-v1.md §5)', () => {
  it.each([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])('lunar month %i, giờ Tý → Mệnh = Thân', (lunarMonth) => {
    const input = { lunarMonth, hourBranch: 'Tý' as const };
    expect(calculateMenhPalace(input)).toBe(calculateThanPalace(input));
  });

  it.each([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])('lunar month %i, giờ Ngọ → Mệnh = Thân', (lunarMonth) => {
    const input = { lunarMonth, hourBranch: 'Ngọ' as const };
    expect(calculateMenhPalace(input)).toBe(calculateThanPalace(input));
  });

  it('every OTHER hour branch produces Mệnh ≠ Thân for at least one month (coincidence is the exception, not the rule)', () => {
    const nonCoincidingHours = EARTHLY_BRANCHES.filter((b) => b !== 'Tý' && b !== 'Ngọ');
    for (const hourBranch of nonCoincidingHours) {
      const input = { lunarMonth: 1, hourBranch };
      expect(calculateMenhPalace(input)).not.toBe(calculateThanPalace(input));
    }
  });
});

describe('calculateMenhPalace / calculateThanPalace — exhaustive coverage: 12 lunar months × 12 hour branches (144 combinations)', () => {
  const allMonths = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  it('every combination produces a valid palace position for both Mệnh and Thân', () => {
    let count = 0;
    for (const lunarMonth of allMonths) {
      for (const hourBranch of EARTHLY_BRANCHES) {
        const menh = calculateMenhPalace({ lunarMonth, hourBranch });
        const than = calculateThanPalace({ lunarMonth, hourBranch });
        expect(EARTHLY_BRANCHES).toContain(menh);
        expect(EARTHLY_BRANCHES).toContain(than);
        count++;
      }
    }
    expect(count).toBe(144);
  });

  it('every combination satisfies the TUVI-MT-03 hard invariant (Thân offset ∈ {0,2,4,6,8,10})', () => {
    for (const lunarMonth of allMonths) {
      for (const hourBranch of EARTHLY_BRANCHES) {
        const menh = calculateMenhPalace({ lunarMonth, hourBranch });
        const than = calculateThanPalace({ lunarMonth, hourBranch });
        expect(isValidThanOffset(menh, than)).toBe(true);
      }
    }
  });

  it('every one of the 6 allowed offsets is actually achieved somewhere in the 144-combination space (the invariant is not vacuously true)', () => {
    const achievedOffsets = new Set<number>();
    for (const lunarMonth of allMonths) {
      for (const hourBranch of EARTHLY_BRANCHES) {
        const menh = calculateMenhPalace({ lunarMonth, hourBranch });
        const than = calculateThanPalace({ lunarMonth, hourBranch });
        const offset = ((getPalaceIndex(than) - getPalaceIndex(menh)) % 12 + 12) % 12;
        achievedOffsets.add(offset);
      }
    }
    expect([...achievedOffsets].sort((a, b) => a - b)).toEqual([...ALLOWED_THAN_OFFSETS_FROM_MENH].sort((a, b) => a - b));
  });

  it('for a fixed lunar month, all 12 hour branches produce exactly 12 (Mệnh, Thân) pairs with no unexplained collapse — Mệnh alone cycles through all 12 palaces exactly once per month (bijective in hour, for fixed month)', () => {
    for (const lunarMonth of allMonths) {
      const menhPositions = EARTHLY_BRANCHES.map((hourBranch) => calculateMenhPalace({ lunarMonth, hourBranch }));
      expect(new Set(menhPositions).size).toBe(12);
    }
  });
});

describe('isValidThanOffset', () => {
  it('accepts every allowed offset', () => {
    for (const offset of ALLOWED_THAN_OFFSETS_FROM_MENH) {
      const menh = EARTHLY_BRANCHES[0]!;
      const than = EARTHLY_BRANCHES[offset]!;
      expect(isValidThanOffset(menh, than)).toBe(true);
    }
  });

  it('rejects an odd offset', () => {
    expect(isValidThanOffset('Tý', 'Sửu')).toBe(false); // offset 1
    expect(isValidThanOffset('Tý', 'Mão')).toBe(false); // offset 3
  });
});

describe('calculateMenhPalace / calculateThanPalace — invalid input', () => {
  it('rejects an out-of-range lunar month', () => {
    expect(() => calculateMenhPalace({ lunarMonth: 0, hourBranch: 'Tý' })).toThrow(RangeError);
    expect(() => calculateMenhPalace({ lunarMonth: 13, hourBranch: 'Tý' })).toThrow(RangeError);
  });

  it('rejects a non-integer lunar month', () => {
    expect(() => calculateMenhPalace({ lunarMonth: 3.5, hourBranch: 'Tý' })).toThrow(RangeError);
  });
});
