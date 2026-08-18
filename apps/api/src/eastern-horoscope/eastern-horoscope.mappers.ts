import type { EasternHoroscopeProfile, EasternHoroscopeProfileHistory } from '@prisma/client';
import { calculateEasternHoroscope } from './engine/eastern-horoscope-engine';
import { getStemBranchForLunarYear, STEM_ELEMENT, BRANCH_ANIMAL, getYearEnergyRelationship, type HeavenlyStem, type EarthlyBranch, type FiveElement, type YinYang } from './engine/eastern-horoscope-tables';
import { getLunarYearForGregorianDate, EASTERN_HOROSCOPE_TIMEZONE_OFFSET_HOURS } from './engine/lunar-calendar.adapter';
import type { YearEnergyRelationship } from './engine/eastern-horoscope-tables';

export interface EasternHoroscopeYearEnergyDto {
  calendarYear: number;
  yearStem: HeavenlyStem;
  yearBranch: EarthlyBranch;
  yearElement: FiveElement;
  yearYinYang: YinYang;
  yearZodiacAnimal: { vi: string; en: string };
  relationship: YearEnergyRelationship;
}

export interface EasternHoroscopeProfileDto {
  id: string;
  status: EasternHoroscopeProfile['status'];
  /** `YYYY-MM-DD`. */
  birthDate: string;
  engineVersion: string;
  calendarVersion: string;
  rulesetVersion: string;
  stem: HeavenlyStem;
  branch: EarthlyBranch;
  element: FiveElement;
  yinYang: YinYang;
  zodiacAnimal: { vi: string; en: string };
  /** Recomputed fresh on every read from the persisted birth facts — never persisted itself, since
   * it changes every calendar year (Bible Module 14 §1's annual cadence). */
  yearEnergy: EasternHoroscopeYearEnergyDto;
  /** Null, or stale (`interpretationYear !== yearEnergy.calendarYear`), when a fresh interpretation
   * for the current calendar year has not yet been generated — the caller decides whether to offer
   * regeneration, this DTO never hides the staleness. */
  interpretation: string | null;
  interpretationYear: number | null;
  interpretationStale: boolean;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}

export interface EasternHoroscopeProfileHistoryDto {
  id: string;
  action: EasternHoroscopeProfileHistory['action'];
  detail: string;
  createdAt: string;
}

/** Recomputes Year Energy fresh from the persisted, immutable birth Stem/Branch/Element — never
 * re-derives the birth facts themselves (those are read as-is from the row, never recalculated). */
function computeYearEnergy(birthElement: FiveElement, now: Date): EasternHoroscopeYearEnergyDto {
  const currentLunarYear = getLunarYearForGregorianDate(now, EASTERN_HOROSCOPE_TIMEZONE_OFFSET_HOURS);
  const { stem, branch } = getStemBranchForLunarYear(currentLunarYear);
  const { element, yinYang } = STEM_ELEMENT[stem];
  return {
    calendarYear: currentLunarYear,
    yearStem: stem,
    yearBranch: branch,
    yearElement: element,
    yearYinYang: yinYang,
    yearZodiacAnimal: BRANCH_ANIMAL[branch],
    relationship: getYearEnergyRelationship(element, birthElement),
  };
}

export function toEasternHoroscopeProfileDto(profile: EasternHoroscopeProfile, now: Date = new Date()): EasternHoroscopeProfileDto {
  const stem = profile.stem as HeavenlyStem;
  const branch = profile.branch as EarthlyBranch;
  const element = profile.element as FiveElement;
  const yearEnergy = computeYearEnergy(element, now);
  return {
    id: profile.id,
    status: profile.status,
    birthDate: profile.birthDate.toISOString().slice(0, 10),
    engineVersion: profile.engineVersion,
    calendarVersion: profile.calendarVersion,
    rulesetVersion: profile.rulesetVersion,
    stem,
    branch,
    element,
    yinYang: profile.yinYang as YinYang,
    zodiacAnimal: { vi: profile.zodiacAnimalVi, en: profile.zodiacAnimalEn },
    yearEnergy,
    interpretation: profile.interpretation,
    interpretationYear: profile.interpretationYear,
    interpretationStale: profile.interpretation !== null && profile.interpretationYear !== yearEnergy.calendarYear,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
    archivedAt: profile.archivedAt?.toISOString() ?? null,
  };
}

export function toEasternHoroscopeProfileHistoryDto(entry: EasternHoroscopeProfileHistory): EasternHoroscopeProfileHistoryDto {
  return { id: entry.id, action: entry.action, detail: entry.detail, createdAt: entry.createdAt.toISOString() };
}

// Re-exported so callers (record service) don't need to import the engine module directly.
export { calculateEasternHoroscope };
