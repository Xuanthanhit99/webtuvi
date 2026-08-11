/**
 * Phase 2 — birth date normalization and validation. Accepts only `YYYY-MM-DD` (the shape a native
 * `<input type="date">` and `class-validator`'s `@IsDateString()` both produce), and rejects
 * anything that isn't a real calendar date — no JavaScript `Date` autocorrection (e.g. "2024-02-30"
 * silently becoming March 2nd) is ever allowed to reach the engine.
 */

export const NUMEROLOGY_DATE_NORMALIZATION_VERSION = 'numerology-date-normalization-v1';

/** Earliest birth year accepted — a deliberate, disclosed sanity floor (nobody living has a
 * numerology reading needing a birth year before this), not a claim about calendar validity. */
export const MIN_BIRTH_YEAR = 1900;

export interface NormalizedBirthDate {
  /** Canonical `YYYY-MM-DD`. */
  iso: string;
  year: number;
  month: number;
  day: number;
}

export type BirthDateValidationErrorCode =
  | 'NUMEROLOGY_INVALID_DATE_FORMAT'
  | 'NUMEROLOGY_INVALID_CALENDAR_DATE'
  | 'NUMEROLOGY_FUTURE_DATE_NOT_ALLOWED'
  | 'NUMEROLOGY_DATE_TOO_OLD';

export class BirthDateValidationError extends Error {
  constructor(public readonly code: BirthDateValidationErrorCode, message: string) {
    super(message);
    this.name = 'BirthDateValidationError';
  }
}

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Parses and validates `input` against real-calendar-date, not-future, and not-too-old rules.
 * Throws `BirthDateValidationError` with a stable code on any failure — never silently corrects or
 * guesses a date. Pure function; `now` is injectable for deterministic testing. */
export function normalizeBirthDate(input: string, now: Date = new Date()): NormalizedBirthDate {
  const match = ISO_DATE_PATTERN.exec(input.trim());
  if (!match) {
    throw new BirthDateValidationError('NUMEROLOGY_INVALID_DATE_FORMAT', 'Birth date must be in YYYY-MM-DD format.');
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const asUtcDate = new Date(Date.UTC(year, month - 1, day));
  const isRealCalendarDate =
    asUtcDate.getUTCFullYear() === year && asUtcDate.getUTCMonth() === month - 1 && asUtcDate.getUTCDate() === day;
  if (!isRealCalendarDate) {
    throw new BirthDateValidationError('NUMEROLOGY_INVALID_CALENDAR_DATE', 'That is not a real calendar date.');
  }

  const startOfTodayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  if (asUtcDate.getTime() > startOfTodayUtc.getTime()) {
    throw new BirthDateValidationError('NUMEROLOGY_FUTURE_DATE_NOT_ALLOWED', 'Birth date cannot be in the future.');
  }

  if (year < MIN_BIRTH_YEAR) {
    throw new BirthDateValidationError('NUMEROLOGY_DATE_TOO_OLD', `Birth year must be ${MIN_BIRTH_YEAR} or later.`);
  }

  return { iso: `${match[1]}-${match[2]}-${match[3]}`, year, month, day };
}
