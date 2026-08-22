import { EARTHLY_BRANCHES } from './tu-vi-palace';
import { TU_VI_CHINH_TINH_IDS } from './tu-vi-chinh-tinh';
import { TU_VI_DIGNITY_STATES, getDignity, annotateDignity } from './tu-vi-dignity';

describe('tu-vi-dignity', () => {
  it('every one of the 14 Chính Tinh has a dignity state defined for all 12 branches (table completeness)', () => {
    for (const star of TU_VI_CHINH_TINH_IDS) {
      for (const branch of EARTHLY_BRANCHES) {
        expect(() => getDignity(star, branch)).not.toThrow();
      }
    }
  });

  it('every star assigns each branch to exactly one dignity state (no overlap, no gap)', () => {
    for (const star of TU_VI_CHINH_TINH_IDS) {
      const seen = new Set<string>();
      for (const branch of EARTHLY_BRANCHES) {
        const state = getDignity(star, branch);
        expect(TU_VI_DIGNITY_STATES).toContain(state);
        seen.add(branch);
      }
      expect(seen.size).toBe(12);
    }
  });

  it('Tử Vi and Thiên Phủ never resolve to Hãm địa (VDTTL-1956 p.33/36 — confirmed on the scan, not an extraction artifact)', () => {
    for (const branch of EARTHLY_BRANCHES) {
      expect(getDignity('Tử Vi', branch)).not.toBe('Hãm địa');
      expect(getDignity('Thiên Phủ', branch)).not.toBe('Hãm địa');
    }
  });

  // Spot-check known cells against the primary source, independently of the completeness loop above.
  it.each([
    ['Tử Vi', 'Tỵ', 'Miếu địa'],
    ['Tử Vi', 'Thìn', 'Vượng địa'],
    ['Tử Vi', 'Sửu', 'Đắc địa'],
    ['Tử Vi', 'Tý', 'Bình hòa'],
    ['Liêm Trinh', 'Tỵ', 'Hãm địa'],
    ['Thiên Đồng', 'Ngọ', 'Hãm địa'],
    ['Thất Sát', 'Dần', 'Miếu địa'],
    ['Phá Quân', 'Tý', 'Miếu địa'],
  ] as const)('%s at %s is %s', (star, branch, expected) => {
    expect(getDignity(star, branch)).toBe(expected);
  });

  it('throws on an unrecognized star/branch combination rather than silently defaulting', () => {
    expect(() => getDignity('Not A Star' as never, 'Tý')).toThrow();
  });

  it('annotateDignity attaches dignity to every placement without altering star/position', () => {
    const placements = [
      { star: 'Tử Vi' as const, position: 'Tỵ' as const },
      { star: 'Liêm Trinh' as const, position: 'Tỵ' as const },
    ];
    const annotated = annotateDignity(placements);
    expect(annotated).toEqual([
      { star: 'Tử Vi', position: 'Tỵ', dignity: 'Miếu địa' },
      { star: 'Liêm Trinh', position: 'Tỵ', dignity: 'Hãm địa' },
    ]);
  });
});
