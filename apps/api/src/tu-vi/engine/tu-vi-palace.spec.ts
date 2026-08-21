import { EARTHLY_BRANCHES, getPalaceIndex, addPalaceOffset, buildPalaceLayout, PALACE_ROLES_FROM_MENH, type PalaceRole } from './tu-vi-palace';

describe('getPalaceIndex / addPalaceOffset', () => {
  it('indexes all 12 branches 0–11 in the fixed Tý…Hợi order', () => {
    EARTHLY_BRANCHES.forEach((branch, i) => expect(getPalaceIndex(branch)).toBe(i));
  });

  it('addPalaceOffset(0) is the identity', () => {
    EARTHLY_BRANCHES.forEach((branch) => expect(addPalaceOffset(branch, 0)).toBe(branch));
  });

  it('wraps forward past Hợi back to Tý', () => {
    expect(addPalaceOffset('Hợi', 1)).toBe('Tý');
    expect(addPalaceOffset('Tuất', 2)).toBe('Tý');
  });

  it('wraps backward (negative offset) past Tý back to Hợi — negative-modulo safety', () => {
    expect(addPalaceOffset('Tý', -1)).toBe('Hợi');
    expect(addPalaceOffset('Dần', -3)).toBe('Hợi');
  });

  it('a full 12-offset round trip returns to the start for every branch', () => {
    EARTHLY_BRANCHES.forEach((branch) => expect(addPalaceOffset(branch, 12)).toBe(branch));
  });
});

describe('buildPalaceLayout — TUVI-CUNG-01 invariants', () => {
  it('exactly one Mệnh, exactly one of each other role, no duplicates, no missing role — for every possible Mệnh position', () => {
    for (const menhPosition of EARTHLY_BRANCHES) {
      const layout = buildPalaceLayout(menhPosition);
      const roles = EARTHLY_BRANCHES.map((branch) => layout[branch]);
      // Exactly the 12 canonical roles, each exactly once (order-independent set equality).
      expect(new Set(roles)).toEqual(new Set(PALACE_ROLES_FROM_MENH));
      expect(roles).toHaveLength(12);
      expect(new Set(roles).size).toBe(12); // no duplicates
      expect(layout[menhPosition]).toBe('Mệnh');
    }
  });

  it('the role order is stable and matches PALACE_ROLES_FROM_MENH walking forward from Mệnh, for every possible Mệnh position', () => {
    for (const menhPosition of EARTHLY_BRANCHES) {
      const layout = buildPalaceLayout(menhPosition);
      PALACE_ROLES_FROM_MENH.forEach((expectedRole: PalaceRole, offset) => {
        const branch = addPalaceOffset(menhPosition, offset);
        expect(layout[branch]).toBe(expectedRole);
      });
    }
  });

  it('TUVI-CUNG-01 resolution: Phụ Mẫu sits at offset +1 from Mệnh, Phúc Đức at +2 (not +1) — the corrected order, not the naive page-6-list-order reading', () => {
    const layout = buildPalaceLayout('Dần'); // Mệnh at Dần for a concrete, readable example
    expect(layout['Mão']).toBe('Phụ Mẫu'); // Dần+1
    expect(layout['Thìn']).toBe('Phúc Đức'); // Dần+2
    expect(layout['Sửu']).toBe('Huynh Đệ'); // Dần+11 (index 2+11=13 mod 12=1=Sửu), last before wrapping to Mệnh
  });

  it('the returned layout is frozen (immutable)', () => {
    const layout = buildPalaceLayout('Tý');
    expect(Object.isFrozen(layout)).toBe(true);
  });
});
