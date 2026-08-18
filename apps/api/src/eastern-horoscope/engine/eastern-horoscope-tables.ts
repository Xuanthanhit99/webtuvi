/**
 * Sprint 17 — fixed, non-disputed reference tables (`docs/domain/eastern-horoscope-rules.md` §3,
 * §5, `RESOLVED_BY_SOURCE`). Pure data, cross-checked this sprint against multiple independent
 * sources — never a disputed/school-specific table like Tử Vi's star-placement rules. Nothing in
 * this file is AI-generated or ever re-derived at runtime; it is looked up, never computed.
 */

export const HEAVENLY_STEMS = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'] as const;
export type HeavenlyStem = (typeof HEAVENLY_STEMS)[number];

export const EARTHLY_BRANCHES = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'] as const;
export type EarthlyBranch = (typeof EARTHLY_BRANCHES)[number];

export const FIVE_ELEMENTS = ['Mộc', 'Hỏa', 'Thổ', 'Kim', 'Thủy'] as const;
export type FiveElement = (typeof FIVE_ELEMENTS)[number];

export type YinYang = 'Dương' | 'Âm';

/** 1984 = Giáp Tý — the widely-cited sexagenary-cycle anchor year, independently cross-checked
 * this sprint against 5 separately-sourced years (1986 Bính Dần, 2013 Quý Tỵ, 2023 Quý Mão, 2024
 * Giáp Thìn, plus the full 2013–2025 Tết-animal sequence) with zero discrepancies
 * (`docs/domain/eastern-horoscope-rules.md` §8b). */
const STEM_BRANCH_ANCHOR_YEAR = 1984; // Giáp(0) Tý(0)

/** Fixed Stem → Yin/Yang + Element (`eastern-horoscope-rules.md` §3). Never disputed, never
 * recomputed — a lookup table, not a formula. */
export const STEM_ELEMENT: Record<HeavenlyStem, { element: FiveElement; yinYang: YinYang }> = {
  Giáp: { element: 'Mộc', yinYang: 'Dương' },
  Ất: { element: 'Mộc', yinYang: 'Âm' },
  Bính: { element: 'Hỏa', yinYang: 'Dương' },
  Đinh: { element: 'Hỏa', yinYang: 'Âm' },
  Mậu: { element: 'Thổ', yinYang: 'Dương' },
  Kỷ: { element: 'Thổ', yinYang: 'Âm' },
  Canh: { element: 'Kim', yinYang: 'Dương' },
  Tân: { element: 'Kim', yinYang: 'Âm' },
  Nhâm: { element: 'Thủy', yinYang: 'Dương' },
  Quý: { element: 'Thủy', yinYang: 'Âm' },
};

/** Fixed Branch → zodiac animal. Vietnamese tradition uses "Mèo" (Cat) for Mão, not "Rabbit" — a
 * well-documented, non-blocking Vietnamese/Chinese locale divergence (P1 item, resolved here as a
 * copy decision, not a domain-correctness question — `eastern-horoscope-rules.md` §3/§14). */
export const BRANCH_ANIMAL: Record<EarthlyBranch, { vi: string; en: string }> = {
  Tý: { vi: 'Chuột', en: 'Rat' },
  Sửu: { vi: 'Trâu', en: 'Ox' },
  Dần: { vi: 'Hổ', en: 'Tiger' },
  Mão: { vi: 'Mèo', en: 'Cat' },
  Thìn: { vi: 'Rồng', en: 'Dragon' },
  Tỵ: { vi: 'Rắn', en: 'Snake' },
  Ngọ: { vi: 'Ngựa', en: 'Horse' },
  Mùi: { vi: 'Dê', en: 'Goat' },
  Thân: { vi: 'Khỉ', en: 'Monkey' },
  Dậu: { vi: 'Gà', en: 'Rooster' },
  Tuất: { vi: 'Chó', en: 'Dog' },
  Hợi: { vi: 'Lợn', en: 'Pig' },
};

export interface StemBranchYear {
  lunarYear: number;
  stem: HeavenlyStem;
  branch: EarthlyBranch;
}

/** Standard sexagenary-cycle arithmetic (`eastern-horoscope-rules.md` §3) — mechanically resolved
 * once a lunar year is known, never a disputed calculation. */
export function getStemBranchForLunarYear(lunarYear: number): StemBranchYear {
  const offset = lunarYear - STEM_BRANCH_ANCHOR_YEAR;
  const stemIndex = ((offset % 10) + 10) % 10;
  const branchIndex = ((offset % 12) + 12) % 12;
  return { lunarYear, stem: HEAVENLY_STEMS[stemIndex]!, branch: EARTHLY_BRANCHES[branchIndex]! };
}

/** Five Elements generating (Tương Sinh) and controlling (Tương Khắc) cycles
 * (`eastern-horoscope-rules.md` §5, `RESOLVED_BY_SOURCE`) — fixed, non-disputed, confirmed across
 * every independent source found this sprint. Index order: Mộc → Hỏa → Thổ → Kim → Thủy → (Mộc). */
const ELEMENT_CYCLE_ORDER: FiveElement[] = ['Mộc', 'Hỏa', 'Thổ', 'Kim', 'Thủy'];

export type YearEnergyRelationship = 'GENERATES' | 'IS_GENERATED_BY' | 'CONTROLS' | 'IS_CONTROLLED_BY' | 'SAME';

/** How `fromElement` (e.g. the current calendar year's element) relates to `toElement` (e.g. the
 * user's own birth-year element) via the fixed generating/controlling cycle — a deterministic
 * lookup, never AI-derived (`eastern-horoscope-rules.md` §5, Bible §6/§18). */
export function getYearEnergyRelationship(fromElement: FiveElement, toElement: FiveElement): YearEnergyRelationship {
  if (fromElement === toElement) return 'SAME';
  const fromIndex = ELEMENT_CYCLE_ORDER.indexOf(fromElement);
  const toIndex = ELEMENT_CYCLE_ORDER.indexOf(toElement);
  const forwardDistance = ((toIndex - fromIndex) % 5 + 5) % 5;
  // Generating cycle: each element generates the next one (distance 1 forward).
  if (forwardDistance === 1) return 'GENERATES';
  if (forwardDistance === 4) return 'IS_GENERATED_BY'; // toElement generates fromElement
  // Controlling cycle: each element controls the element two steps ahead.
  if (forwardDistance === 2) return 'CONTROLS';
  return 'IS_CONTROLLED_BY'; // forwardDistance === 3
}
