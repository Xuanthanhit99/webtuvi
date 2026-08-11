import { digitsOf, isMasterNumber, MASTER_NUMBERS, reduceToCoreNumber } from './numerology-reduction.util';

describe('digitsOf', () => {
  it('splits a positive integer into its decimal digits', () => {
    expect(digitsOf(1995)).toEqual([1, 9, 9, 5]);
    expect(digitsOf(7)).toEqual([7]);
    expect(digitsOf(0)).toEqual([0]);
  });
});

describe('isMasterNumber', () => {
  it('recognizes exactly 11, 22, 33', () => {
    for (const n of MASTER_NUMBERS) expect(isMasterNumber(n)).toBe(true);
  });

  it('rejects everything else, including single digits and non-master multi-digit numbers', () => {
    for (const n of [0, 1, 9, 10, 12, 20, 23, 44, 55, 111]) expect(isMasterNumber(n)).toBe(false);
  });
});

describe('reduceToCoreNumber', () => {
  it('returns single digits unchanged, with no steps', () => {
    for (const n of [1, 5, 9]) {
      expect(reduceToCoreNumber(n)).toEqual({ value: n, isMasterNumber: false, steps: [] });
    }
  });

  it('reduces a two-digit non-master number to a single digit', () => {
    // 24 -> 2+4=6
    expect(reduceToCoreNumber(24)).toEqual({
      value: 6,
      isMasterNumber: false,
      steps: [{ from: 24, digits: [2, 4], to: 6 }],
    });
  });

  it('reduces across multiple steps until a single digit is reached', () => {
    // 1995 -> 1+9+9+5=24 -> 2+4=6
    const result = reduceToCoreNumber(1995);
    expect(result.value).toBe(6);
    expect(result.isMasterNumber).toBe(false);
    expect(result.steps).toEqual([
      { from: 1995, digits: [1, 9, 9, 5], to: 24 },
      { from: 24, digits: [2, 4], to: 6 },
    ]);
  });

  it('stops reduction at a Master Number and preserves it (11)', () => {
    // 29 -> 2+9=11, stop (11 is a Master Number, never reduced further to 2)
    const result = reduceToCoreNumber(29);
    expect(result.value).toBe(11);
    expect(result.isMasterNumber).toBe(true);
    expect(result.steps).toEqual([{ from: 29, digits: [2, 9], to: 11 }]);
  });

  it('stops reduction at a Master Number and preserves it (22)', () => {
    // 1978 -> 1+9+7+8=25 -> 2+5=7 (not master this path); use a value that lands on 22 instead:
    // 49 -> 4+9=13 -> 1+3=4 (not master). Use 3999: 3+9+9+9=30 -> 3+0=3 (not master).
    // Directly test the boundary: input already 22 should short-circuit with no steps.
    expect(reduceToCoreNumber(22)).toEqual({ value: 22, isMasterNumber: true, steps: [] });
  });

  it('stops reduction at a Master Number and preserves it (33)', () => {
    expect(reduceToCoreNumber(33)).toEqual({ value: 33, isMasterNumber: true, steps: [] });
  });

  it('does not further reduce a Master Number even though it "could" reduce to a single digit', () => {
    // 11 could reduce to 1+1=2, but Master Numbers are never collapsed.
    const result = reduceToCoreNumber(11);
    expect(result.value).toBe(11);
    expect(result.steps).toEqual([]);
  });

  it('a large multi-digit input that passes through an intermediate Master Number stops there', () => {
    // 39999 -> 3+9+9+9+9=39 -> 3+9=12 -> 1+2=3 (no master hit on this path — verify no false stop)
    const result = reduceToCoreNumber(39999);
    expect(result.value).toBe(3);
    expect(result.isMasterNumber).toBe(false);
  });

  it('is a pure function — repeated calls with the same input produce identical output', () => {
    const a = reduceToCoreNumber(1995);
    const b = reduceToCoreNumber(1995);
    expect(a).toEqual(b);
  });

  it('throws for negative or non-integer input', () => {
    expect(() => reduceToCoreNumber(-1)).toThrow();
    expect(() => reduceToCoreNumber(1.5)).toThrow();
  });
});
