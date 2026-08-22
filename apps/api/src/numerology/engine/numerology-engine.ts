import { calculateLifePathFromDateParts } from '@beaconvie/types/numerology';
import { normalizeBirthDate, type NormalizedBirthDate } from './numerology-date.util';
import { normalizeName, sumNameLetters, type NameNumberBreakdown, type NormalizedName } from './numerology-name.util';
import { reduceToCoreNumber, type ReductionResult } from './numerology-reduction.util';

/**
 * Phase 3 — the deterministic Numerology Engine. Pure functions only: no DB access, no I/O, no AI
 * call, no randomness. Every value is a reproducible function of `{ fullBirthName, birthDate }`
 * (Sprint 8 brief, Phase 3: "reproducible from the same normalized input"). This is the ONE place
 * in the product that computes a numerology number — nothing else (including the AI interpretation
 * layer) is ever allowed to invent, adjust, or recalculate a core number.
 *
 * Convention: standard Pythagorean numerology (Product Bible Module 15 §17). Life Path and Personal
 * Year both use the "reduce month, reduce day, reduce year separately, then reduce their sum" method
 * (rather than digit-summing the entire date string at once) — this is the more commonly taught
 * Pythagorean method and gives clearer per-component transparency steps for the UI (Sprint 8 brief,
 * Phase 13). Master Number preservation (11/22/33, `numerology-reduction.util.ts`) applies
 * identically at every reduction stage of every number, including date-component sub-reductions —
 * one rule, applied uniformly, never scattered per-call special-casing.
 */

export const NUMEROLOGY_ENGINE_VERSION = 'numerology-pythagorean-v1';

export const NUMEROLOGY_VALUE_TYPES = [
  'LIFE_PATH',
  'EXPRESSION',
  'SOUL_URGE',
  'PERSONALITY',
  'BIRTHDAY',
  'PERSONAL_YEAR',
] as const;
export type NumerologyValueType = (typeof NUMEROLOGY_VALUE_TYPES)[number];

export interface DateComponentReduction {
  component: 'MONTH' | 'DAY' | 'YEAR';
  input: number;
  reduction: ReductionResult;
}

export interface DateBasedBreakdown {
  normalizedDate: string;
  components: DateComponentReduction[];
  total: number;
  finalReduction: ReductionResult;
}

export interface NameBasedBreakdown extends NameNumberBreakdown {
  reduction: ReductionResult;
}

export interface NumerologyValueResult<TBreakdown> {
  type: NumerologyValueType;
  value: number;
  isMasterNumber: boolean;
  breakdown: TBreakdown;
}

export interface NumerologyCalculationResult {
  engineVersion: string;
  input: {
    fullBirthName: string;
    birthDate: string;
  };
  normalizedInput: {
    birthName: string;
    birthDate: string;
  };
  personalYearAppliesTo: number;
  values: {
    LIFE_PATH: NumerologyValueResult<DateBasedBreakdown>;
    EXPRESSION: NumerologyValueResult<NameBasedBreakdown>;
    SOUL_URGE: NumerologyValueResult<NameBasedBreakdown>;
    PERSONALITY: NumerologyValueResult<NameBasedBreakdown>;
    BIRTHDAY: NumerologyValueResult<DateComponentReduction>;
    PERSONAL_YEAR: NumerologyValueResult<DateBasedBreakdown>;
  };
}

function reduceDateTotal(components: DateComponentReduction[]): { total: number; finalReduction: ReductionResult } {
  const total = components.reduce((sum, c) => sum + c.reduction.value, 0);
  return { total, finalReduction: reduceToCoreNumber(total) };
}

/** Life Path Number — from the birth date. Reduce month, day, and (multi-digit) year separately,
 * then reduce their sum. */
function calculateLifePath(date: NormalizedBirthDate): NumerologyValueResult<DateBasedBreakdown> {
  const shared = calculateLifePathFromDateParts(date);
  return {
    type: 'LIFE_PATH',
    value: shared.value,
    isMasterNumber: shared.isMasterNumber,
    breakdown: shared.breakdown,
  };
}

/** Birthday Number — the day-of-month component alone, reduced. Deliberately recomputed
 * independently from Life Path's own day component (not merely copied by reference) so this value
 * type stands alone and is independently reproducible/testable. */
function calculateBirthday(date: NormalizedBirthDate): NumerologyValueResult<DateComponentReduction> {
  const reduction = reduceToCoreNumber(date.day);
  return {
    type: 'BIRTHDAY',
    value: reduction.value,
    isMasterNumber: reduction.isMasterNumber,
    breakdown: { component: 'DAY', input: date.day, reduction },
  };
}

/** Personal Year Number — reduce(birth month) + reduce(birth day) + reduce(the calendar year this
 * reading is being calculated for), then reduce the sum. Time-bound by design (Product Bible Module
 * 15 §7/§8: lower-durability, annual-cadence content) — `personalYearAppliesTo` records which
 * calendar year this value describes, so a reading viewed in a later year is honestly labeled
 * stale rather than silently implying it is current. */
function calculatePersonalYear(date: NormalizedBirthDate, forYear: number): NumerologyValueResult<DateBasedBreakdown> {
  const components: DateComponentReduction[] = [
    { component: 'MONTH', input: date.month, reduction: reduceToCoreNumber(date.month) },
    { component: 'DAY', input: date.day, reduction: reduceToCoreNumber(date.day) },
    { component: 'YEAR', input: forYear, reduction: reduceToCoreNumber(forYear) },
  ];
  const { total, finalReduction } = reduceDateTotal(components);
  return {
    type: 'PERSONAL_YEAR',
    value: finalReduction.value,
    isMasterNumber: finalReduction.isMasterNumber,
    breakdown: { normalizedDate: date.iso, components, total, finalReduction },
  };
}

function calculateNameNumber(
  type: 'EXPRESSION' | 'SOUL_URGE' | 'PERSONALITY',
  name: NormalizedName,
  filter: 'ALL' | 'VOWELS' | 'CONSONANTS',
): NumerologyValueResult<NameBasedBreakdown> {
  const breakdown = sumNameLetters(name, filter);
  const reduction = reduceToCoreNumber(breakdown.sum);
  return { type, value: reduction.value, isMasterNumber: reduction.isMasterNumber, breakdown: { ...breakdown, reduction } };
}

export interface CalculateNumerologyInput {
  fullBirthName: string;
  /** `YYYY-MM-DD`. */
  birthDate: string;
}

export interface CalculateNumerologyOptions {
  /** Injectable for deterministic tests and for pinning which calendar year Personal Year applies
   * to; defaults to the real current time. */
  now?: Date;
}

/** The engine's single entry point. Throws `BirthDateValidationError` or `NameValidationError` on
 * invalid input — never returns a partial or guessed result. */
export function calculateNumerology(input: CalculateNumerologyInput, options: CalculateNumerologyOptions = {}): NumerologyCalculationResult {
  const now = options.now ?? new Date();
  const date = normalizeBirthDate(input.birthDate, now);
  const name = normalizeName(input.fullBirthName);
  const personalYearAppliesTo = now.getUTCFullYear();

  return {
    engineVersion: NUMEROLOGY_ENGINE_VERSION,
    input: { fullBirthName: input.fullBirthName, birthDate: input.birthDate },
    normalizedInput: { birthName: name.display, birthDate: date.iso },
    personalYearAppliesTo,
    values: {
      LIFE_PATH: calculateLifePath(date),
      EXPRESSION: calculateNameNumber('EXPRESSION', name, 'ALL'),
      SOUL_URGE: calculateNameNumber('SOUL_URGE', name, 'VOWELS'),
      PERSONALITY: calculateNameNumber('PERSONALITY', name, 'CONSONANTS'),
      BIRTHDAY: calculateBirthday(date),
      PERSONAL_YEAR: calculatePersonalYear(date, personalYearAppliesTo),
    },
  };
}
