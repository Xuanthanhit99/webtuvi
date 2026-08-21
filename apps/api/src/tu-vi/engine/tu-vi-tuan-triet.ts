import { EARTHLY_BRANCHES, getPalaceIndex, addPalaceOffset, type EarthlyBranch } from './tu-vi-palace';
import { HEAVENLY_STEMS, type HeavenlyStem } from '../../eastern-horoscope/engine/eastern-horoscope-tables';

/**
 * TUVI-TUAN-01 / TUVI-TRIET-01 (`canonical-ruleset-v1.md` §1 rows 18–19) — Tuần Trung Không Vong
 * (Tuần) and Triệt Lộ Không Vong (Triệt), VDTTL-1956 p.16–17.
 *
 * Structural note: Tuần and Triệt are NOT chính-tinh-style single-palace stars — each is a pair of
 * two adjacent palaces, a distinct domain concept from `ChinhTinhId`/`Core13StarId` placements
 * (`SECONDARY-TUANTRIET-BASIS`, re-confirmed this sprint: Tuần derives from the birth year's
 * Tuần-Giáp decade group; Triệt derives from the birth year's Can alone — different input bases,
 * not analogous rules, per this project's longstanding, explicitly-tested discipline).
 */

export interface PalacePair {
  readonly first: EarthlyBranch;
  readonly second: EarthlyBranch;
}

/** Tuần's 6 decade groups, keyed by the group's own "Giáp X" starting Chi (not by a string range —
 * see `getTuanDecadeStartChi` for how a birth year resolves to one of these 6 keys). VDTTL-1956
 * p.16–17, cross-checked against its own worked example (Bính Dần → Tuất, Hợi). */
const TUAN_TABLE_BY_DECADE_START: Readonly<Partial<Record<EarthlyBranch, PalacePair>>> = {
  Tý: { first: 'Tuất', second: 'Hợi' }, // Giáp Tý – Quý Dậu
  Tuất: { first: 'Thân', second: 'Dậu' }, // Giáp Tuất – Quý Mùi
  Thân: { first: 'Ngọ', second: 'Mùi' }, // Giáp Thân – Quý Tỵ
  Ngọ: { first: 'Thìn', second: 'Tỵ' }, // Giáp Ngọ – Quý Mão
  Thìn: { first: 'Dần', second: 'Mão' }, // Giáp Thìn – Quý Sửu
  Dần: { first: 'Tý', second: 'Sửu' }, // Giáp Dần – Quý Hợi
};

/**
 * TUVI-TRIET-01 convention lock, implemented EXACTLY as frozen, traceable in code (not silently
 * hidden): VDTTL-1956's own table (p.17) states Ất/Canh → Mùi, Ngọ — but the book's own worked
 * example on the SAME page ("Sinh năm Canh Ngọ an Triệt ở giữa cung Thân và cung Dậu") gives
 * Thân, Dậu instead (the Giáp/Kỷ row's value), a genuine internal contradiction re-confirmed
 * `PRIMARY_SOURCE_RECHECKED` 3 times. Per the disclosed, now doubly-independently-corroborated
 * (`tracuutuvi.com` + `vietdich.blogspot.com`, citing a third named 1975 source) convention lock,
 * this table uses the PRINTED TABLE value (Mùi, Ngọ for Ất/Canh), NOT the book's own worked
 * example. See `canonical-ruleset-v1.md` §1 row 19 / `source-corroboration-matrix.md` for full
 * evidence. This is the one and only place this convention is applied.
 */
const TRIET_TABLE_BY_CAN_PAIR: ReadonlyArray<{ readonly stems: readonly HeavenlyStem[]; readonly pair: PalacePair }> = [
  { stems: ['Giáp', 'Kỷ'], pair: { first: 'Thân', second: 'Dậu' } },
  { stems: ['Ất', 'Canh'], pair: { first: 'Mùi', second: 'Ngọ' } }, // convention-locked: table, not the Canh-Ngọ worked example (which would give Thân, Dậu)
  { stems: ['Bính', 'Tân'], pair: { first: 'Thìn', second: 'Tỵ' } },
  { stems: ['Đinh', 'Nhâm'], pair: { first: 'Dần', second: 'Mão' } },
  { stems: ['Mậu', 'Quý'], pair: { first: 'Tý', second: 'Sửu' } },
];

function mod12(n: number): number {
  return ((n % 12) + 12) % 12;
}

/** Which of the 6 "Giáp X" decade-group starting Chis a birth year belongs to, derived from the
 * year's own Can position within the 10-stem cycle (Giáp=0…Quý=9) and its Chi — not a string-range
 * match. Reused mechanic: `decadeStart = yearChi − stemPosition (mod 12)`. */
export function getTuanDecadeStartChi(yearStem: HeavenlyStem, yearChi: EarthlyBranch): EarthlyBranch {
  const stemPosition = HEAVENLY_STEMS.indexOf(yearStem);
  return EARTHLY_BRANCHES[mod12(getPalaceIndex(yearChi) - stemPosition)]!;
}

export function calculateTuan(yearStem: HeavenlyStem, yearChi: EarthlyBranch): PalacePair {
  const decadeStart = getTuanDecadeStartChi(yearStem, yearChi);
  const pair = TUAN_TABLE_BY_DECADE_START[decadeStart];
  if (!pair) {
    throw new Error(`calculateTuan: no Tuần entry for decadeStart=${decadeStart} (yearStem=${yearStem}, yearChi=${yearChi}) — defect in TUAN_TABLE_BY_DECADE_START, not a possible real outcome (all 6 yang-branch decade starts must be covered).`);
  }
  return pair;
}

export function calculateTriet(yearStem: HeavenlyStem): PalacePair {
  const row = TRIET_TABLE_BY_CAN_PAIR.find((r) => r.stems.includes(yearStem));
  if (!row) {
    throw new Error(`calculateTriet: no Triệt entry for yearStem=${yearStem} — defect in TRIET_TABLE_BY_CAN_PAIR, not a possible real outcome (all 10 Cans must be covered across the 5 pairs).`);
  }
  return row.pair;
}

export { addPalaceOffset };
