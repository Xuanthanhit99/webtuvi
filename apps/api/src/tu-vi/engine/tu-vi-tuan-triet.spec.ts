import { calculateTuan, calculateTriet, getTuanDecadeStartChi } from './tu-vi-tuan-triet';
import { HEAVENLY_STEMS, EARTHLY_BRANCHES } from '../../eastern-horoscope/engine/eastern-horoscope-tables';
import type { HeavenlyStem, EarthlyBranch } from './tu-vi-can-chi';
import type { PalacePair } from './tu-vi-tuan-triet';

/**
 * Independent fixture for Tuần, structurally different from production's "decadeStart =
 * (chiIndex − stemIndex) mod 12, then table lookup" — this derives, for each of the 60 valid
 * sexagenary offsets `k` from the Giáp Tý anchor (k=0), which of the 6 printed decade-group rows
 * it falls in via `Math.floor(k/10)`, a completely different computation path sharing no object
 * identity with `tu-vi-tuan-triet.ts`.
 */
const EXPECTED_TUAN_BY_DECADE_GROUP: readonly PalacePair[] = [
  { first: 'Tuất', second: 'Hợi' }, // group 0: Giáp Tý – Quý Dậu
  { first: 'Thân', second: 'Dậu' }, // group 1: Giáp Tuất – Quý Mùi
  { first: 'Ngọ', second: 'Mùi' }, // group 2: Giáp Thân – Quý Tỵ
  { first: 'Thìn', second: 'Tỵ' }, // group 3: Giáp Ngọ – Quý Mão
  { first: 'Dần', second: 'Mão' }, // group 4: Giáp Thìn – Quý Sửu
  { first: 'Tý', second: 'Sửu' }, // group 5: Giáp Dần – Quý Hợi
];

function allSexagenaryPairs(): Array<{ k: number; stem: HeavenlyStem; chi: EarthlyBranch }> {
  return Array.from({ length: 60 }, (_, k) => ({ k, stem: HEAVENLY_STEMS[k % 10]!, chi: EARTHLY_BRANCHES[k % 12]! }));
}

describe('calculateTuan — exhaustive state space (all 60 valid sexagenary Can-Chi years), independent fixture', () => {
  it('every one of the 60 valid years matches the independently-derived decade-group fixture', () => {
    for (const { k, stem, chi } of allSexagenaryPairs()) {
      const actual = calculateTuan(stem, chi);
      const expected = EXPECTED_TUAN_BY_DECADE_GROUP[Math.floor(k / 10) % 6];
      expect(actual).toEqual(expected);
    }
  });

  it('reproduces the book\'s own worked example (Bính Dần → Tuất, Hợi)', () => {
    expect(calculateTuan('Bính', 'Dần')).toEqual({ first: 'Tuất', second: 'Hợi' });
  });

  it('getTuanDecadeStartChi resolves Mậu Thân correctly to decade start Thìn (independently traced by hand, Sprint 18A.5)', () => {
    expect(getTuanDecadeStartChi('Mậu', 'Thân')).toBe('Thìn');
  });
});

describe('calculateTriet — exhaustive state space (all 10 year Cans)', () => {
  const expected: Record<HeavenlyStem, PalacePair> = {
    Giáp: { first: 'Thân', second: 'Dậu' },
    Kỷ: { first: 'Thân', second: 'Dậu' },
    Ất: { first: 'Mùi', second: 'Ngọ' },
    Canh: { first: 'Mùi', second: 'Ngọ' },
    Bính: { first: 'Thìn', second: 'Tỵ' },
    Tân: { first: 'Thìn', second: 'Tỵ' },
    Đinh: { first: 'Dần', second: 'Mão' },
    Nhâm: { first: 'Dần', second: 'Mão' },
    Mậu: { first: 'Tý', second: 'Sửu' },
    Quý: { first: 'Tý', second: 'Sửu' },
  };

  it.each(HEAVENLY_STEMS)('yearStem=%s matches the independently-transcribed expected table', (stem) => {
    expect(calculateTriet(stem)).toEqual(expected[stem]);
  });
});

/**
 * TUVI-TRIET-01 convention-lock regression + historical-conflict reproduction (mandatory per the
 * governing task). VDTTL-1956's own worked example claims Canh Ngọ → Thân, Dậu; this engine
 * deliberately does NOT follow that — it follows the table (Mùi, Ngọ), per the disclosed,
 * doubly-corroborated convention lock. Both values are asserted explicitly below so the historical
 * disagreement stays visible in the test suite, not just in a comment.
 */
describe('calculateTriet — TUVI-TRIET-01 convention-lock regression', () => {
  it('Canh year → Mùi, Ngọ (the LOCKED value, per the table)', () => {
    expect(calculateTriet('Canh')).toEqual({ first: 'Mùi', second: 'Ngọ' });
  });

  it('Canh year is explicitly NOT Thân, Dậu (the book\'s own disputed worked-example value for a Canh Ngọ birth, deliberately not followed)', () => {
    expect(calculateTriet('Canh')).not.toEqual({ first: 'Thân', second: 'Dậu' });
  });

  it('Thân, Dậu is reserved for its own correct row (Giáp/Kỷ) — proving this is a real, distinct table row, not an arbitrarily banned value', () => {
    expect(calculateTriet('Giáp')).toEqual({ first: 'Thân', second: 'Dậu' });
    expect(calculateTriet('Kỷ')).toEqual({ first: 'Thân', second: 'Dậu' });
  });
});

describe('calculateTuan / calculateTriet — determinism', () => {
  it('repeated calls produce byte-identical output', () => {
    const tuan1 = calculateTuan('Đinh', 'Sửu');
    const tuan2 = calculateTuan('Đinh', 'Sửu');
    expect(tuan1).toEqual(tuan2);
    const triet1 = calculateTriet('Nhâm');
    const triet2 = calculateTriet('Nhâm');
    expect(triet1).toEqual(triet2);
  });
});
