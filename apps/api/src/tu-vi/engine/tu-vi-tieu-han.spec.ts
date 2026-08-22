import { EARTHLY_BRANCHES } from './tu-vi-palace';
import { calculateTieuHanStart, getTieuHanPalace } from './tu-vi-tieu-han';

describe('tu-vi-tieu-han', () => {
  it('boy born year Tý starts at Tuất, thuận (VDTTL-1956 p.22 worked example, first 3 steps)', () => {
    const start = calculateTieuHanStart({ yearBranch: 'Tý', sex: 'Nam' });
    expect(start).toEqual({ startPalace: 'Tuất', thuan: true });
    expect(getTieuHanPalace(start, 13)).toBe('Tuất'); // age 1 equivalent (0 steps)
    expect(getTieuHanPalace(start, 14)).toBe('Hợi'); // 1 step thuận
    expect(getTieuHanPalace(start, 15)).toBe('Tý'); // 2 steps thuận
  });

  it('same birth year, a girl (Nữ) walks nghịch instead', () => {
    const start = calculateTieuHanStart({ yearBranch: 'Tý', sex: 'Nữ' });
    expect(start).toEqual({ startPalace: 'Tuất', thuan: false });
    expect(getTieuHanPalace(start, 14)).toBe('Dậu'); // 1 step nghịch from Tuất
  });

  it('starting-palace table covers all 12 birth-year branches (completeness)', () => {
    for (const branch of EARTHLY_BRANCHES) {
      expect(() => calculateTieuHanStart({ yearBranch: branch, sex: 'Nam' })).not.toThrow();
    }
  });

  it.each([
    ['Dần', 'Thìn'], ['Ngọ', 'Thìn'], ['Tuất', 'Thìn'],
    ['Tỵ', 'Mùi'], ['Dậu', 'Mùi'], ['Sửu', 'Mùi'],
    ['Thân', 'Tuất'], ['Tý', 'Tuất'], ['Thìn', 'Tuất'],
    ['Hợi', 'Sửu'], ['Mão', 'Sửu'], ['Mùi', 'Sửu'],
  ] as const)('year branch %s starts at %s', (yearBranch, expectedStart) => {
    expect(calculateTieuHanStart({ yearBranch, sex: 'Nam' }).startPalace).toBe(expectedStart);
  });

  it('cycles with period 12 (age 13 and age 25 land on the same palace)', () => {
    const start = calculateTieuHanStart({ yearBranch: 'Dần', sex: 'Nữ' });
    expect(getTieuHanPalace(start, 13)).toBe(getTieuHanPalace(start, 25));
    expect(getTieuHanPalace(start, 20)).toBe(getTieuHanPalace(start, 32));
  });

  it('rejects ages below 13 (the separate, unimplemented child system) rather than silently computing a wrong answer', () => {
    const start = calculateTieuHanStart({ yearBranch: 'Tý', sex: 'Nam' });
    expect(() => getTieuHanPalace(start, 12)).toThrow(RangeError);
    expect(() => getTieuHanPalace(start, 0)).toThrow(RangeError);
    expect(() => getTieuHanPalace(start, 1.5)).toThrow(RangeError);
  });
});
