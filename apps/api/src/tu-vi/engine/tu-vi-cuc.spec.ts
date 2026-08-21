import { calculateCuc, TU_VI_CUC_IDS, TU_VI_CUC_NUMBER, type TuViCucId } from './tu-vi-cuc';
import { EARTHLY_BRANCHES } from './tu-vi-palace';
import type { HeavenlyStem, EarthlyBranch } from './tu-vi-can-chi';

const HEAVENLY_STEMS: readonly HeavenlyStem[] = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'];

/**
 * Table-fixture independence (Phase 8): this expected matrix is re-typed here, fresh, from
 * `canonical-ruleset-v1.md` §3 — it does NOT import `CUC_TABLE`, `MENH_CHI_GROUP_INDEX`, or
 * `CAN_GROUP_INDEX` from `tu-vi-cuc.ts`. A bad production transcription (wrong cell, swapped row,
 * swapped column, wrong group membership) would be caught here, since this file has no shared
 * object identity with production at all — only the same primary-source table, transcribed twice,
 * independently.
 */
const EXPECTED_MENH_CHI_ROW_GROUPS: ReadonlyArray<ReadonlyArray<EarthlyBranch>> = [
  ['Tý', 'Sửu'],
  ['Dần', 'Mão', 'Tuất', 'Hợi'],
  ['Thìn', 'Tỵ'],
  ['Ngọ', 'Mùi'],
  ['Thân', 'Dậu'],
];

const EXPECTED_CAN_COLUMN_GROUPS: ReadonlyArray<ReadonlyArray<HeavenlyStem>> = [
  ['Giáp', 'Kỷ'],
  ['Ất', 'Canh'],
  ['Bính', 'Tân'],
  ['Đinh', 'Nhâm'],
  ['Mậu', 'Quý'],
];

const EXPECTED_CUC_MATRIX: ReadonlyArray<ReadonlyArray<TuViCucId>> = [
  ['Thủy Nhị Cục', 'Hỏa Lục Cục', 'Thổ Ngũ Cục', 'Mộc Tam Cục', 'Kim Tứ Cục'],
  ['Hỏa Lục Cục', 'Thổ Ngũ Cục', 'Mộc Tam Cục', 'Kim Tứ Cục', 'Thủy Nhị Cục'],
  ['Mộc Tam Cục', 'Kim Tứ Cục', 'Thủy Nhị Cục', 'Hỏa Lục Cục', 'Thổ Ngũ Cục'],
  ['Thổ Ngũ Cục', 'Mộc Tam Cục', 'Kim Tứ Cục', 'Thủy Nhị Cục', 'Hỏa Lục Cục'],
  ['Kim Tứ Cục', 'Thủy Nhị Cục', 'Hỏa Lục Cục', 'Thổ Ngũ Cục', 'Mộc Tam Cục'],
];

/** Expands the independent 5×5 fixture above into all 120 concrete (branch, stem) → Cục pairs. */
function expectedCuc(menhPosition: EarthlyBranch, yearStem: HeavenlyStem): TuViCucId {
  const rowIndex = EXPECTED_MENH_CHI_ROW_GROUPS.findIndex((group) => group.includes(menhPosition));
  const colIndex = EXPECTED_CAN_COLUMN_GROUPS.findIndex((group) => group.includes(yearStem));
  return EXPECTED_CUC_MATRIX[rowIndex]![colIndex]!;
}

describe('calculateCuc — exhaustive state space (12 Mệnh branches × 10 year stems = 120 combinations), independent fixture', () => {
  it('every combination matches the independently-transcribed expected matrix', () => {
    let count = 0;
    for (const menhPosition of EARTHLY_BRANCHES) {
      for (const yearStem of HEAVENLY_STEMS) {
        const actual = calculateCuc({ yearStem, menhPosition });
        const expected = expectedCuc(menhPosition, yearStem);
        expect(actual).toBe(expected);
        count++;
      }
    }
    expect(count).toBe(120);
  });

  it('every one of the 5 canonical Cục values is actually produced somewhere in the 120-combination space', () => {
    const produced = new Set<TuViCucId>();
    for (const menhPosition of EARTHLY_BRANCHES) {
      for (const yearStem of HEAVENLY_STEMS) {
        produced.add(calculateCuc({ yearStem, menhPosition }));
      }
    }
    expect([...produced].sort()).toEqual([...TU_VI_CUC_IDS].sort());
  });

  it('every result is a member of the closed TU_VI_CUC_IDS union (never a 6th value, never null/undefined)', () => {
    for (const menhPosition of EARTHLY_BRANCHES) {
      for (const yearStem of HEAVENLY_STEMS) {
        expect(TU_VI_CUC_IDS).toContain(calculateCuc({ yearStem, menhPosition }));
      }
    }
  });
});

/**
 * Table-orientation attack tests (Phase 6). Each case below is chosen specifically because the
 * table is NOT symmetric at that cell — a row/column swap, a Can-group reversal, a palace-position
 * reversal, or an off-by-one group-index bug would produce a DIFFERENT Cục than the correct one at
 * this exact cell. Each test's inline comment states which specific mutation class it protects
 * against (cross-referenced in the final report's adversarial-mutation table).
 */
describe('calculateCuc — table-orientation attack tests', () => {
  it('Tý (row 0) + Giáp (col 0) = Thủy Nhị Cục — the [0][0] anchor cell; catches a wholesale table replacement', () => {
    expect(calculateCuc({ yearStem: 'Giáp', menhPosition: 'Tý' })).toBe('Thủy Nhị Cục');
  });

  it('row/column swap detector: Thìn (row 2) + Giáp/Kỷ (col 0) = Mộc Tam Cục, but Tý/Sửu (row 0) + Bính/Tân (col 2) = Thổ Ngũ Cục — these are NOT the same value, so a row↔column transposition of the whole table would be caught here', () => {
    expect(calculateCuc({ yearStem: 'Giáp', menhPosition: 'Thìn' })).toBe('Mộc Tam Cục');
    expect(calculateCuc({ yearStem: 'Bính', menhPosition: 'Tý' })).toBe('Thổ Ngũ Cục');
  });

  it('Can-group reversal detector: Ất (col 1) and Đinh (col 3) at the same Mệnh row (Tý) produce different Cục — a reversed column order would swap these', () => {
    const withAt = calculateCuc({ yearStem: 'Ất', menhPosition: 'Tý' });
    const withDinh = calculateCuc({ yearStem: 'Đinh', menhPosition: 'Tý' });
    expect(withAt).toBe('Hỏa Lục Cục');
    expect(withDinh).toBe('Mộc Tam Cục');
    expect(withAt).not.toBe(withDinh);
  });

  it('palace-position (row) reversal detector: Dần (row 1) and Thân (row 4) at the same Can (Giáp) produce different Cục — a reversed row order would swap these', () => {
    const withDan = calculateCuc({ yearStem: 'Giáp', menhPosition: 'Dần' });
    const withThan = calculateCuc({ yearStem: 'Giáp', menhPosition: 'Thân' });
    expect(withDan).toBe('Hỏa Lục Cục');
    expect(withThan).toBe('Kim Tứ Cục');
    expect(withDan).not.toBe(withThan);
  });

  it('Chi-indexing off-by-one detector: all 4 branches in the "Dần,Mão,Tuất,Hợi" group produce the SAME Cục for a fixed Can (proving group membership, not individual-branch indexing, drives the result) — an off-by-one would misfile one of these into a neighboring group and break this', () => {
    const results = ['Dần', 'Mão', 'Tuất', 'Hợi'].map((branch) => calculateCuc({ yearStem: 'Mậu', menhPosition: branch as EarthlyBranch }));
    expect(new Set(results).size).toBe(1);
    // row "Dần,Mão,Tuất,Hợi" × col "Mậu,Quý" = Thủy Nhị Cục (canonical-ruleset-v1.md §3) — not to
    // be confused with the Kim Tứ Cục coverage test above, which correctly uses this same row with
    // a DIFFERENT Can (Đinh, col "Đinh,Nhâm") to hit Kim Tứ Cục instead.
    expect(results[0]).toBe('Thủy Nhị Cục');
  });

  it('wrong-modulo/group-boundary detector: Thìn (start of the "Thìn,Tỵ" group) and Tỵ (end of the same group) agree with each other but disagree with Ngọ (the very next group) for the same Can', () => {
    const thin = calculateCuc({ yearStem: 'Quý', menhPosition: 'Thìn' });
    const ty = calculateCuc({ yearStem: 'Quý', menhPosition: 'Tỵ' });
    const ngo = calculateCuc({ yearStem: 'Quý', menhPosition: 'Ngọ' });
    expect(thin).toBe(ty);
    expect(thin).not.toBe(ngo);
  });
});

/**
 * Kim Tứ Cục coverage (Phase 5/9) — this Cục's determination matters more than the other four's,
 * because its downstream Tử Vi-anchor table (`TUVI-TVA-02`, Sprint 18B.4) has a genuine, disclosed
 * `CONVENTION_LOCK_REQUIRED` conflict (day 21 printed twice, day 24 nowhere). Getting the Cục
 * determination itself exactly right for every input that should produce Kim Tứ Cục is therefore
 * the load-bearing precondition for 18B.4's own locked convention being applied to the correct
 * charts. This test does NOT implement or reference the day-21/24 convention itself — only that
 * `'Kim Tứ Cục'` is produced for exactly the right (Can, Mệnh-branch) combinations, per the table.
 */
describe('calculateCuc — Kim Tứ Cục coverage (RULE_DERIVED_TEST_VECTOR, all 5 group-cells producing Kim Tứ Cục)', () => {
  const kimTuCases: Array<[yearStem: HeavenlyStem, menhPosition: EarthlyBranch]> = [
    ['Mậu', 'Tý'], // Tý,Sửu row × Mậu,Quý col
    ['Đinh', 'Dần'], // Dần,Mão,Tuất,Hợi row × Đinh,Nhâm col
    ['Ất', 'Thìn'], // Thìn,Tỵ row × Ất,Canh col
    ['Bính', 'Ngọ'], // Ngọ,Mùi row × Bính,Tân col
    ['Giáp', 'Thân'], // Thân,Dậu row × Giáp,Kỷ col
  ];

  it.each(kimTuCases)('yearStem=%s, menhPosition=%s → Kim Tứ Cục', (yearStem, menhPosition) => {
    expect(calculateCuc({ yearStem, menhPosition })).toBe('Kim Tứ Cục');
  });

  it('reproduces this project\'s own Sprint 18A.5 rule-derived vectors B2/B3 exactly (Mậu Thân year context → Mệnh Tý → Kim Tứ Cục)', () => {
    // From golden-vector-v2-spec.md VECTOR-B2/B3: Can Mậu + Mệnh Tý → Kim Tứ Cục. Labeled
    // RULE_DERIVED_TEST_VECTOR there and here — never an independent golden vector.
    expect(calculateCuc({ yearStem: 'Mậu', menhPosition: 'Tý' })).toBe('Kim Tứ Cục');
  });
});

describe('calculateCuc — Mệnh variation and year-stem variation (RULE_DERIVED_TEST_VECTOR, reproducing golden-vector-v2-spec.md B1/B4/B5/B6)', () => {
  it('B1: Giáp + Mệnh Dần → Hỏa Lục Cục', () => {
    expect(calculateCuc({ yearStem: 'Giáp', menhPosition: 'Dần' })).toBe('Hỏa Lục Cục');
  });
  it('B4: Canh + Mệnh Dần → Thổ Ngũ Cục', () => {
    expect(calculateCuc({ yearStem: 'Canh', menhPosition: 'Dần' })).toBe('Thổ Ngũ Cục');
  });
  it('B5: Ất + Mệnh Ngọ → Mộc Tam Cục', () => {
    expect(calculateCuc({ yearStem: 'Ất', menhPosition: 'Ngọ' })).toBe('Mộc Tam Cục');
  });
  it('B6: Bính + Mệnh Tỵ → Thủy Nhị Cục', () => {
    expect(calculateCuc({ yearStem: 'Bính', menhPosition: 'Tỵ' })).toBe('Thủy Nhị Cục');
  });
});

describe('TU_VI_CUC_NUMBER — numeric mapping', () => {
  it('matches the traditional numeric labels exactly', () => {
    expect(TU_VI_CUC_NUMBER).toEqual({
      'Thủy Nhị Cục': 2,
      'Mộc Tam Cục': 3,
      'Kim Tứ Cục': 4,
      'Thổ Ngũ Cục': 5,
      'Hỏa Lục Cục': 6,
    });
  });

  it('every calculateCuc result maps to a number in [2,6]', () => {
    for (const menhPosition of EARTHLY_BRANCHES) {
      for (const yearStem of HEAVENLY_STEMS) {
        const cuc = calculateCuc({ yearStem, menhPosition });
        expect(TU_VI_CUC_NUMBER[cuc]).toBeGreaterThanOrEqual(2);
        expect(TU_VI_CUC_NUMBER[cuc]).toBeLessThanOrEqual(6);
      }
    }
  });
});

describe('calculateCuc — determinism', () => {
  it('repeated calls with identical input produce byte-identical output', () => {
    const input = { yearStem: 'Quý' as const, menhPosition: 'Hợi' as const };
    const results = Array.from({ length: 20 }, () => calculateCuc(input));
    expect(new Set(results).size).toBe(1);
  });
});

describe('calculateCuc — internal invariant guard (impossible-lookup path)', () => {
  it('throws rather than silently defaulting if given a value outside the closed Can/Chi unions (simulated defect)', () => {
    expect(() => calculateCuc({ yearStem: 'NotAStem' as unknown as HeavenlyStem, menhPosition: 'Tý' })).toThrow();
    expect(() => calculateCuc({ yearStem: 'Giáp', menhPosition: 'NotABranch' as unknown as EarthlyBranch })).toThrow();
  });
});
