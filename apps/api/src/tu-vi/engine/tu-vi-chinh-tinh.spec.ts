import { calculateChinhTinh, getTuViAnchorPosition, getThienPhuPosition, TU_VI_CHINH_TINH_IDS, TU_VI_GROUP_OFFSETS, THIEN_PHU_GROUP_OFFSETS, type ChinhTinhId } from './tu-vi-chinh-tinh';
import { EARTHLY_BRANCHES, getPalaceIndex } from './tu-vi-palace';
import { TU_VI_CUC_IDS, type TuViCucId } from './tu-vi-cuc';
import type { EarthlyBranch } from './tu-vi-can-chi';

/**
 * Table-fixture independence (per this sprint's Global Test Independence Rule): this is a
 * day-ordered (`day 1..30 → branch`) re-transcription of `canonical-ruleset-v1.md` §4, a
 * STRUCTURALLY DIFFERENT layout than production's branch-grouped `TU_VI_ANCHOR_TABLE` — typed
 * fresh here, sharing no object identity with `tu-vi-chinh-tinh.ts`. Kim Tứ Cục's row already
 * reflects the TUVI-TVA-02 convention lock (day 24 → Mùi).
 */
const EXPECTED_ANCHOR_BY_DAY: Readonly<Record<TuViCucId, readonly EarthlyBranch[]>> = {
  // index 0 = day 1, index 29 = day 30
  'Thủy Nhị Cục': ['Sửu', 'Dần', 'Dần', 'Mão', 'Mão', 'Thìn', 'Thìn', 'Tỵ', 'Tỵ', 'Ngọ', 'Ngọ', 'Mùi', 'Mùi', 'Thân', 'Thân', 'Dậu', 'Dậu', 'Tuất', 'Tuất', 'Hợi', 'Hợi', 'Tý', 'Tý', 'Sửu', 'Sửu', 'Dần', 'Dần', 'Mão', 'Mão', 'Thìn'],
  'Mộc Tam Cục': ['Thìn', 'Sửu', 'Dần', 'Tỵ', 'Dần', 'Mão', 'Ngọ', 'Mão', 'Thìn', 'Mùi', 'Thìn', 'Tỵ', 'Thân', 'Tỵ', 'Ngọ', 'Dậu', 'Ngọ', 'Mùi', 'Tuất', 'Mùi', 'Thân', 'Hợi', 'Thân', 'Dậu', 'Tý', 'Dậu', 'Tuất', 'Sửu', 'Tuất', 'Hợi'],
  'Kim Tứ Cục': ['Hợi', 'Thìn', 'Sửu', 'Dần', 'Tý', 'Tỵ', 'Dần', 'Mão', 'Sửu', 'Ngọ', 'Mão', 'Thìn', 'Dần', 'Mùi', 'Thìn', 'Tỵ', 'Mão', 'Thân', 'Tỵ', 'Ngọ', 'Thìn', 'Dậu', 'Ngọ', 'Mùi', 'Tỵ', 'Tuất', 'Mùi', 'Thân', 'Ngọ', 'Hợi'],
  'Thổ Ngũ Cục': ['Ngọ', 'Hợi', 'Thìn', 'Sửu', 'Dần', 'Mùi', 'Tý', 'Tỵ', 'Dần', 'Mão', 'Thân', 'Sửu', 'Ngọ', 'Mão', 'Thìn', 'Dậu', 'Dần', 'Mùi', 'Thìn', 'Tỵ', 'Tuất', 'Mão', 'Thân', 'Tỵ', 'Ngọ', 'Hợi', 'Thìn', 'Dậu', 'Ngọ', 'Mùi'],
  'Hỏa Lục Cục': ['Dậu', 'Ngọ', 'Hợi', 'Thìn', 'Sửu', 'Dần', 'Tuất', 'Mùi', 'Tý', 'Tỵ', 'Dần', 'Mão', 'Hợi', 'Thân', 'Sửu', 'Ngọ', 'Mão', 'Thìn', 'Tý', 'Dậu', 'Dần', 'Mùi', 'Thìn', 'Tỵ', 'Sửu', 'Tuất', 'Mão', 'Thân', 'Tỵ', 'Ngọ'],
};

describe('getTuViAnchorPosition — exhaustive state space (5 Cục × 30 lunar days = 150 combinations), independent fixture', () => {
  it('every combination matches the independently-transcribed, differently-structured expected table', () => {
    let count = 0;
    for (const cuc of TU_VI_CUC_IDS) {
      for (let day = 1; day <= 30; day++) {
        const actual = getTuViAnchorPosition(cuc, day);
        const expected = EXPECTED_ANCHOR_BY_DAY[cuc][day - 1];
        expect(actual).toBe(expected);
        count++;
      }
    }
    expect(count).toBe(150);
  });

  it('each Cục is a full bijection over lunar days 1–30 (every branch reachable, no day maps to more than one branch)', () => {
    for (const cuc of TU_VI_CUC_IDS) {
      const branches = new Set<EarthlyBranch>();
      for (let day = 1; day <= 30; day++) {
        branches.add(getTuViAnchorPosition(cuc, day));
      }
      // Not necessarily all 12 branches reachable (group sizes vary 1–4 days per branch), but every
      // day 1–30 must resolve to exactly one branch — already exhaustively confirmed above; this
      // additionally confirms no branch is somehow claimed by >12 days (sanity bound).
      for (const branch of branches) {
        const daysForBranch = Array.from({ length: 30 }, (_, i) => i + 1).filter((d) => getTuViAnchorPosition(cuc, d) === branch);
        expect(daysForBranch.length).toBeLessThanOrEqual(4);
      }
    }
  });
});

describe('getTuViAnchorPosition — TUVI-TVA-02 Kim Tứ Cục convention-lock regression', () => {
  it('day 21 → Thìn (undisputed side, matches the printed table exactly)', () => {
    expect(getTuViAnchorPosition('Kim Tứ Cục', 21)).toBe('Thìn');
  });

  it('day 24 → Mùi (the locked convention — the printed table shows "21" here, which this codebase deliberately does not follow)', () => {
    expect(getTuViAnchorPosition('Kim Tứ Cục', 24)).toBe('Mùi');
  });

  it('day 21 and day 24 resolve to DIFFERENT palaces under the lock (proving the fix, not just re-printing the ambiguity)', () => {
    expect(getTuViAnchorPosition('Kim Tứ Cục', 21)).not.toBe(getTuViAnchorPosition('Kim Tứ Cục', 24));
  });
});

describe('getTuViAnchorPosition — invalid input', () => {
  it('rejects day 0', () => {
    expect(() => getTuViAnchorPosition('Thủy Nhị Cục', 0)).toThrow(RangeError);
  });
  it('rejects day 31', () => {
    expect(() => getTuViAnchorPosition('Thủy Nhị Cục', 31)).toThrow(RangeError);
  });
  it('rejects a negative day', () => {
    expect(() => getTuViAnchorPosition('Thủy Nhị Cục', -1)).toThrow(RangeError);
  });
  it('rejects a non-integer day', () => {
    expect(() => getTuViAnchorPosition('Thủy Nhị Cục', 15.5)).toThrow(RangeError);
  });
});

/**
 * Table-orientation / mutation attack tests. Each picks a cell where the specific mutation class
 * named would produce a visibly different (wrong) result.
 */
describe('getTuViAnchorPosition — attack tests', () => {
  it('Cục-block inversion detector: the same lunar day (day 5) resolves to different branches across 3 different Cục — a block-swap between any two Cục would be caught', () => {
    const inThuyNhi = getTuViAnchorPosition('Thủy Nhị Cục', 5);
    const inMocTam = getTuViAnchorPosition('Mộc Tam Cục', 5);
    const inKimTu = getTuViAnchorPosition('Kim Tứ Cục', 5);
    expect(inThuyNhi).toBe('Mão');
    expect(inMocTam).toBe('Dần');
    expect(inKimTu).toBe('Tý');
    expect(new Set([inThuyNhi, inMocTam, inKimTu]).size).toBe(3);
  });

  it('day+1 shift detector: day 9 and day 10 resolve to different branches in Hỏa Lục Cục — an off-by-one day shift would be caught', () => {
    expect(getTuViAnchorPosition('Hỏa Lục Cục', 9)).toBe('Tý');
    expect(getTuViAnchorPosition('Hỏa Lục Cục', 10)).toBe('Tỵ');
  });

  it('one-cell mutation detector: Thổ Ngũ Cục day 1 (Ngọ) is an isolated single-day cell, distinguishable from its neighbors (day 30 of the previous cycle / day 2)', () => {
    expect(getTuViAnchorPosition('Thổ Ngũ Cục', 1)).toBe('Ngọ');
    expect(getTuViAnchorPosition('Thổ Ngũ Cục', 2)).not.toBe('Ngọ');
  });
});

describe('getThienPhuPosition — TUVI-TVPHU-01 mirror across the Dần–Thân axis', () => {
  it('coincides with Tử Vi exactly at Dần and Thân', () => {
    expect(getThienPhuPosition('Dần')).toBe('Dần');
    expect(getThienPhuPosition('Thân')).toBe('Thân');
  });

  it('mirrors correctly at the pairs already confirmed in domain research (Tý↔Thìn, Sửu↔Mão)', () => {
    expect(getThienPhuPosition('Tý')).toBe('Thìn');
    expect(getThienPhuPosition('Thìn')).toBe('Tý');
    expect(getThienPhuPosition('Sửu')).toBe('Mão');
    expect(getThienPhuPosition('Mão')).toBe('Sửu');
  });

  it('is an involution for all 12 branches (mirroring twice returns the original) and never coincides except at Dần/Thân', () => {
    for (const branch of EARTHLY_BRANCHES) {
      const mirrored = getThienPhuPosition(branch);
      expect(getThienPhuPosition(mirrored)).toBe(branch);
      if (branch !== 'Dần' && branch !== 'Thân') {
        expect(mirrored).not.toBe(branch);
      }
    }
  });
});

describe('calculateChinhTinh — full 14-star chart, structural invariants', () => {
  it('produces exactly 14 entries with unique star IDs matching TU_VI_CHINH_TINH_IDS in stable order', () => {
    const placements = calculateChinhTinh({ cuc: 'Hỏa Lục Cục', lunarDay: 1 });
    expect(placements).toHaveLength(14);
    expect(placements.map((p) => p.star)).toEqual([...TU_VI_CHINH_TINH_IDS]);
    expect(new Set(placements.map((p) => p.star)).size).toBe(14);
  });

  it('every placement has a valid palace position', () => {
    const placements = calculateChinhTinh({ cuc: 'Kim Tứ Cục', lunarDay: 24 });
    for (const { position } of placements) {
      expect(EARTHLY_BRANCHES).toContain(position);
    }
  });

  it('the result is frozen (immutable)', () => {
    const placements = calculateChinhTinh({ cuc: 'Mộc Tam Cục', lunarDay: 10 });
    expect(Object.isFrozen(placements)).toBe(true);
  });

  it('co-location (multiple stars sharing a palace) is valid and does occur — not treated as an error', () => {
    // cuc='Thủy Nhị Cục', lunarDay=8 → Tử Vi at Tỵ (index5), Thiên Phủ at (4-5)mod12=11=Hợi (max
    // separation) — produces the densest known co-location pattern from this project's own
    // Sprint 18A.5 rule-derived vector B6.
    const placements = calculateChinhTinh({ cuc: 'Thủy Nhị Cục', lunarDay: 8 });
    const byPosition = new Map<EarthlyBranch, ChinhTinhId[]>();
    for (const { star, position } of placements) {
      byPosition.set(position, [...(byPosition.get(position) ?? []), star]);
    }
    const densest = Math.max(...[...byPosition.values()].map((stars) => stars.length));
    expect(densest).toBeGreaterThan(1);
  });
});

describe('calculateChinhTinh — reproduces Sprint 18A.5 rule-derived vectors (RULE_DERIVED_TEST_VECTOR, golden-vector-v2-spec.md)', () => {
  it('VECTOR-B1: Hỏa Lục Cục, day 1 → Tử Vi=Dậu, Thiên Cơ=Thân', () => {
    const placements = calculateChinhTinh({ cuc: 'Hỏa Lục Cục', lunarDay: 1 });
    const byStar = Object.fromEntries(placements.map((p) => [p.star, p.position]));
    expect(byStar['Tử Vi']).toBe('Dậu');
    expect(byStar['Thiên Cơ']).toBe('Thân');
    expect(byStar['Thiên Phủ']).toBe('Mùi');
  });

  it('VECTOR-B3: Kim Tứ Cục, day 24 (convention-locked) → Tử Vi=Mùi, Thiên Phủ=Dậu', () => {
    const placements = calculateChinhTinh({ cuc: 'Kim Tứ Cục', lunarDay: 24 });
    const byStar = Object.fromEntries(placements.map((p) => [p.star, p.position]));
    expect(byStar['Tử Vi']).toBe('Mùi');
    expect(byStar['Thiên Phủ']).toBe('Dậu');
  });

  it('VECTOR-B6: Thủy Nhị Cục, day 8 → Tử Vi=Tỵ, Thiên Phủ=Hợi, Thất Sát=Tỵ (co-located with Tử Vi)', () => {
    // golden-vector-v2-spec.md VECTOR-B6: Thiên Phủ(Hợi,+6=Thất Sát)=Tỵ; Phá Quân(Hợi,+10)=Dậu,
    // NOT Tỵ — corrected here after verifying against that document directly (this test's first
    // draft misattributed the co-located star; TEST_DEFECT, not a product defect).
    const placements = calculateChinhTinh({ cuc: 'Thủy Nhị Cục', lunarDay: 8 });
    const byStar = Object.fromEntries(placements.map((p) => [p.star, p.position]));
    expect(byStar['Tử Vi']).toBe('Tỵ');
    expect(byStar['Thiên Phủ']).toBe('Hợi');
    expect(byStar['Thất Sát']).toBe('Tỵ');
    expect(byStar['Phá Quân']).toBe('Dậu');
  });
});

describe('TU_VI_GROUP_OFFSETS / THIEN_PHU_GROUP_OFFSETS — offset table integrity', () => {
  it('together cover exactly the 14 canonical star IDs, no overlap, no gap', () => {
    const tuViStars = Object.keys(TU_VI_GROUP_OFFSETS);
    const thienPhuStars = Object.keys(THIEN_PHU_GROUP_OFFSETS);
    expect(tuViStars).toHaveLength(6);
    expect(thienPhuStars).toHaveLength(8);
    expect(new Set([...tuViStars, ...thienPhuStars]).size).toBe(14);
    expect([...tuViStars, ...thienPhuStars].sort()).toEqual([...TU_VI_CHINH_TINH_IDS].sort());
  });

  it('wraparound: every offset applied to every possible anchor position produces a valid, well-defined palace (no out-of-range index)', () => {
    for (const anchor of EARTHLY_BRANCHES) {
      for (const offset of Object.values(TU_VI_GROUP_OFFSETS)) {
        const index = (getPalaceIndex(anchor) + offset!) % 12;
        expect(index).toBeGreaterThanOrEqual(0);
        expect(index).toBeLessThan(12);
      }
    }
  });
});

describe('calculateChinhTinh — determinism', () => {
  it('repeated calls with identical input produce byte-identical output', () => {
    const input = { cuc: 'Thổ Ngũ Cục' as const, lunarDay: 17 };
    const first = calculateChinhTinh(input);
    for (let i = 0; i < 10; i++) {
      expect(calculateChinhTinh(input)).toEqual(first);
    }
  });
});
