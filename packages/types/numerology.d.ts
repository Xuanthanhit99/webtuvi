export const MASTER_NUMBERS: readonly [11, 22, 33];
export type MasterNumber = (typeof MASTER_NUMBERS)[number];
export const MIN_BIRTH_YEAR: 1900;

export interface ReductionStep {
  from: number;
  digits: number[];
  to: number;
}

export interface ReductionResult {
  value: number;
  isMasterNumber: boolean;
  steps: ReductionStep[];
}

export type BirthDateValidationErrorCode =
  | 'NUMEROLOGY_INVALID_DATE_FORMAT'
  | 'NUMEROLOGY_INVALID_CALENDAR_DATE'
  | 'NUMEROLOGY_FUTURE_DATE_NOT_ALLOWED'
  | 'NUMEROLOGY_DATE_TOO_OLD';

export class BirthDateValidationError extends Error {
  readonly code: BirthDateValidationErrorCode;
  constructor(code: BirthDateValidationErrorCode, message: string);
}

export interface NormalizedBirthDate {
  iso: string;
  year: number;
  month: number;
  day: number;
}

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

export interface LifePathCalculationResult {
  type: 'LIFE_PATH';
  value: number;
  isMasterNumber: boolean;
  breakdown: DateBasedBreakdown;
}

export function isMasterNumber(value: number): value is MasterNumber;
export function digitsOf(value: number): number[];
export function reduceToCoreNumber(input: number): ReductionResult;
export function normalizeBirthDate(input: string, now?: Date): NormalizedBirthDate;
export function calculateLifePathFromDateParts(date: NormalizedBirthDate): LifePathCalculationResult;
export function calculateLifePathNumber(birthDate: string, options?: { now?: Date }): LifePathCalculationResult;
