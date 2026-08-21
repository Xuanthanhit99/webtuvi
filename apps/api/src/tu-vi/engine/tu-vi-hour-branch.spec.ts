import { getHourBranch } from './tu-vi-hour-branch';

describe('getHourBranch — all 12 branches (TUVI-GIO-01, VDTTL-1956 p.6)', () => {
  const cases: Array<[hour: number, minute: number, expected: string]> = [
    [23, 30, 'Tý'],
    [1, 30, 'Sửu'],
    [3, 30, 'Dần'],
    [5, 30, 'Mão'],
    [7, 30, 'Thìn'],
    [9, 30, 'Tỵ'],
    [11, 30, 'Ngọ'],
    [13, 30, 'Mùi'],
    [15, 30, 'Thân'],
    [17, 30, 'Dậu'],
    [19, 30, 'Tuất'],
    [21, 30, 'Hợi'],
  ];

  it.each(cases)('%i:%i → %s', (hour, minute, expected) => {
    expect(getHourBranch(hour, minute)).toBe(expected);
  });

  it('all 12 branches are reachable (no gap, no duplicate coverage) across the full 0–23 hour range', () => {
    const seen = new Set<string>();
    for (let hour = 0; hour <= 23; hour++) {
      seen.add(getHourBranch(hour, 0));
    }
    expect(seen.size).toBe(12);
  });
});

describe('getHourBranch — Tý boundary (the frozen 23:xx/00:xx convention, TUVI-GIO-01)', () => {
  const cases: Array<[hour: number, minute: number, expected: string]> = [
    [22, 59, 'Hợi'],
    [23, 0, 'Tý'],
    [23, 30, 'Tý'],
    [23, 59, 'Tý'],
    [0, 0, 'Tý'],
    [0, 30, 'Tý'],
    [0, 59, 'Tý'],
    [1, 0, 'Sửu'],
  ];

  it.each(cases)('%i:%i → %s', (hour, minute, expected) => {
    expect(getHourBranch(hour, minute)).toBe(expected);
  });

  it('Tý is a single undivided window, not split into Sơ/Chính sub-branches — 23:00 and 00:30 both resolve to the exact same label', () => {
    expect(getHourBranch(23, 0)).toBe(getHourBranch(0, 30));
  });
});

describe('getHourBranch — every other hour-boundary edge (start-of-window is inclusive, end is exclusive)', () => {
  const boundaries: Array<[hour: number, expectedAtStart: string, hourBeforeExpected: string]> = [
    [3, 'Dần', 'Sửu'],
    [5, 'Mão', 'Dần'],
    [7, 'Thìn', 'Mão'],
    [9, 'Tỵ', 'Thìn'],
    [11, 'Ngọ', 'Tỵ'],
    [13, 'Mùi', 'Ngọ'],
    [15, 'Thân', 'Mùi'],
    [17, 'Dậu', 'Thân'],
    [19, 'Tuất', 'Dậu'],
    [21, 'Hợi', 'Tuất'],
  ];

  it.each(boundaries)('hour %i:00 starts %s, hour %i-1:59 is still %s', (hour, expectedAtStart, hourBeforeExpected) => {
    expect(getHourBranch(hour, 0)).toBe(expectedAtStart);
    expect(getHourBranch(hour - 1, 59)).toBe(hourBeforeExpected);
  });
});

describe('getHourBranch — invalid input', () => {
  it('rejects an out-of-range hour', () => {
    expect(() => getHourBranch(24, 0)).toThrow(RangeError);
    expect(() => getHourBranch(-1, 0)).toThrow(RangeError);
  });

  it('rejects an out-of-range minute', () => {
    expect(() => getHourBranch(10, 60)).toThrow(RangeError);
    expect(() => getHourBranch(10, -1)).toThrow(RangeError);
  });

  it('rejects a non-integer hour or minute', () => {
    expect(() => getHourBranch(10.5, 0)).toThrow(RangeError);
    expect(() => getHourBranch(10, 30.5)).toThrow(RangeError);
  });
});
