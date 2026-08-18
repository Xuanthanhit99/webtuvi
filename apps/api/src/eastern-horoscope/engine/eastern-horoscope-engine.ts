import { getLunarYearForGregorianDate, EASTERN_HOROSCOPE_TIMEZONE_OFFSET_HOURS } from './lunar-calendar.adapter';
import {
  getStemBranchForLunarYear,
  STEM_ELEMENT,
  BRANCH_ANIMAL,
  getYearEnergyRelationship,
  type HeavenlyStem,
  type EarthlyBranch,
  type FiveElement,
  type YinYang,
  type YearEnergyRelationship,
} from './eastern-horoscope-tables';

/**
 * Sprint 17 — the deterministic Eastern Horoscope engine. Pure functions only: no DB access, no
 * I/O, no AI call, no randomness. Mirrors Numerology's own engine discipline
 * (`numerology-engine.ts`) exactly — this is the ONE place in the product that computes a birth
 * Stem/Branch/zodiac/element/Year-Energy result; nothing downstream (including the AI
 * interpretation layer) may invent, adjust, or recalculate any of it.
 *
 * Ruleset encodes the two Sprint 17 Domain Decision Closure founder decisions
 * (`docs/domain/eastern-horoscope-rules.md` §0):
 *   EASTERN_HOROSCOPE_YEAR_BOUNDARY = LUNAR_NEW_YEAR
 *   EASTERN_HOROSCOPE_ELEMENT_SYSTEM = HEAVENLY_STEM_ELEMENT
 */

export const EASTERN_HOROSCOPE_ENGINE_VERSION = 'eastern-horoscope-engine-v1';
export const EASTERN_HOROSCOPE_CALENDAR_VERSION = 'eastern-horoscope-calendar-hnd-v1';
export const EASTERN_HOROSCOPE_RULESET_VERSION = 'eastern-horoscope-ruleset-lny-stem-v1';

export const EASTERN_HOROSCOPE_YEAR_BOUNDARY = 'LUNAR_NEW_YEAR' as const;
export const EASTERN_HOROSCOPE_ELEMENT_SYSTEM = 'HEAVENLY_STEM_ELEMENT' as const;

export class BirthDateValidationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'BirthDateValidationError';
  }
}

/** Same bounds discipline as Natal Chart/Numerology's own date validators — reject nonsensical
 * input explicitly rather than silently computing a meaningless result. */
const MIN_BIRTH_YEAR = 1900;

export interface EasternHoroscopeBirthProfile {
  lunarYear: number;
  stem: HeavenlyStem;
  branch: EarthlyBranch;
  element: FiveElement;
  yinYang: YinYang;
  zodiacAnimal: { vi: string; en: string };
}

export interface EasternHoroscopeYearEnergy {
  calendarYear: number;
  yearStem: HeavenlyStem;
  yearBranch: EarthlyBranch;
  yearElement: FiveElement;
  yearYinYang: YinYang;
  yearZodiacAnimal: { vi: string; en: string };
  /** How the current calendar year's element relates to the user's own birth-year element — a
   * fixed lookup against the Five Elements cycle, never AI-derived. */
  relationship: YearEnergyRelationship;
}

export interface EasternHoroscopeCalculationResult {
  engineVersion: string;
  calendarVersion: string;
  rulesetVersion: string;
  yearBoundary: typeof EASTERN_HOROSCOPE_YEAR_BOUNDARY;
  elementSystem: typeof EASTERN_HOROSCOPE_ELEMENT_SYSTEM;
  input: { birthDate: string };
  birthProfile: EasternHoroscopeBirthProfile;
  yearEnergy: EasternHoroscopeYearEnergy;
}

function toBirthProfile(lunarYear: number): EasternHoroscopeBirthProfile {
  const { stem, branch } = getStemBranchForLunarYear(lunarYear);
  const { element, yinYang } = STEM_ELEMENT[stem];
  return { lunarYear, stem, branch, element, yinYang, zodiacAnimal: BRANCH_ANIMAL[branch] };
}

export interface CalculateEasternHoroscopeInput {
  /** `YYYY-MM-DD`. */
  birthDate: string;
}

export interface CalculateEasternHoroscopeOptions {
  /** Injectable for deterministic tests and to pin which calendar year Year Energy is computed
   * against; defaults to the real current time. */
  now?: Date;
}

function parseBirthDate(birthDate: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate);
  if (!match) {
    throw new BirthDateValidationError('Birth date must be in YYYY-MM-DD format.', 'EASTERN_HOROSCOPE_INVALID_DATE_FORMAT');
  }
  const [, yearStr, monthStr, dayStr] = match;
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  const date = new Date(Date.UTC(year, month - 1, day));
  const isRealCalendarDate = date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  if (!isRealCalendarDate) {
    throw new BirthDateValidationError('Birth date is not a real calendar date.', 'EASTERN_HOROSCOPE_INVALID_DATE');
  }
  if (year < MIN_BIRTH_YEAR) {
    throw new BirthDateValidationError(`Birth year must be ${MIN_BIRTH_YEAR} or later.`, 'EASTERN_HOROSCOPE_DATE_OUT_OF_RANGE');
  }
  const now = new Date();
  if (date.getTime() > now.getTime()) {
    throw new BirthDateValidationError('Birth date cannot be in the future.', 'EASTERN_HOROSCOPE_FUTURE_DATE');
  }
  return date;
}

/** The engine's single entry point. Throws `BirthDateValidationError` on invalid input — never
 * returns a partial or guessed result (mirrors Numerology's `calculateNumerology` precedent). */
export function calculateEasternHoroscope(
  input: CalculateEasternHoroscopeInput,
  options: CalculateEasternHoroscopeOptions = {},
): EasternHoroscopeCalculationResult {
  const now = options.now ?? new Date();
  const birthDate = parseBirthDate(input.birthDate);

  const birthLunarYear = getLunarYearForGregorianDate(birthDate, EASTERN_HOROSCOPE_TIMEZONE_OFFSET_HOURS);
  const birthProfile = toBirthProfile(birthLunarYear);

  const currentLunarYear = getLunarYearForGregorianDate(now, EASTERN_HOROSCOPE_TIMEZONE_OFFSET_HOURS);
  const currentYearProfile = getStemBranchForLunarYear(currentLunarYear);
  const currentElement = STEM_ELEMENT[currentYearProfile.stem];
  const relationship = getYearEnergyRelationship(currentElement.element, birthProfile.element);

  return {
    engineVersion: EASTERN_HOROSCOPE_ENGINE_VERSION,
    calendarVersion: EASTERN_HOROSCOPE_CALENDAR_VERSION,
    rulesetVersion: EASTERN_HOROSCOPE_RULESET_VERSION,
    yearBoundary: EASTERN_HOROSCOPE_YEAR_BOUNDARY,
    elementSystem: EASTERN_HOROSCOPE_ELEMENT_SYSTEM,
    input: { birthDate: input.birthDate },
    birthProfile,
    yearEnergy: {
      calendarYear: currentLunarYear,
      yearStem: currentYearProfile.stem,
      yearBranch: currentYearProfile.branch,
      yearElement: currentElement.element,
      yearYinYang: currentElement.yinYang,
      yearZodiacAnimal: BRANCH_ANIMAL[currentYearProfile.branch],
      relationship,
    },
  };
}
