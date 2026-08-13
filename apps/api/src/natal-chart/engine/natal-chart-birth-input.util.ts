/**
 * Birth date/time normalization and validation — mirrors
 * `numerology-date.util.ts#normalizeBirthDate`'s discipline exactly (real-calendar-date checks,
 * no JS `Date` autocorrection, no silent guessing), extended with an optional birth time.
 */

export const NATAL_CHART_DATE_NORMALIZATION_VERSION = 'natal-chart-date-normalization-v1';

/** Same disclosed sanity floor as Numerology's `MIN_BIRTH_YEAR` — not a calendar-validity claim. */
export const NATAL_CHART_MIN_BIRTH_YEAR = 1900;

export interface NormalizedBirthDate {
  /** Canonical `YYYY-MM-DD`. */
  iso: string;
  year: number;
  month: number;
  day: number;
}

export interface NormalizedBirthTime {
  /** Canonical `HH:mm`, 24-hour. */
  iso: string;
  hour: number;
  minute: number;
}

export type BirthInputValidationErrorCode =
  | 'NATAL_CHART_INVALID_DATE_FORMAT'
  | 'NATAL_CHART_INVALID_CALENDAR_DATE'
  | 'NATAL_CHART_FUTURE_DATE_NOT_ALLOWED'
  | 'NATAL_CHART_DATE_TOO_OLD'
  | 'NATAL_CHART_INVALID_TIME_FORMAT';

export class BirthInputValidationError extends Error {
  constructor(
    public readonly code: BirthInputValidationErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'BirthInputValidationError';
  }
}

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const ISO_TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** Throws `BirthInputValidationError` with a stable code on any failure — never silently corrects
 * or guesses a date. Pure function; `now` is injectable for deterministic testing. */
export function normalizeBirthDate(input: string, now: Date = new Date()): NormalizedBirthDate {
  const match = ISO_DATE_PATTERN.exec(input.trim());
  if (!match) {
    throw new BirthInputValidationError('NATAL_CHART_INVALID_DATE_FORMAT', 'Birth date must be in YYYY-MM-DD format.');
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const asUtcDate = new Date(Date.UTC(year, month - 1, day));
  const isRealCalendarDate =
    asUtcDate.getUTCFullYear() === year && asUtcDate.getUTCMonth() === month - 1 && asUtcDate.getUTCDate() === day;
  if (!isRealCalendarDate) {
    throw new BirthInputValidationError('NATAL_CHART_INVALID_CALENDAR_DATE', 'That is not a real calendar date.');
  }

  const startOfTodayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  if (asUtcDate.getTime() > startOfTodayUtc.getTime()) {
    throw new BirthInputValidationError('NATAL_CHART_FUTURE_DATE_NOT_ALLOWED', 'Birth date cannot be in the future.');
  }

  if (year < NATAL_CHART_MIN_BIRTH_YEAR) {
    throw new BirthInputValidationError('NATAL_CHART_DATE_TOO_OLD', `Birth year must be ${NATAL_CHART_MIN_BIRTH_YEAR} or later.`);
  }

  return { iso: `${match[1]}-${match[2]}-${match[3]}`, year, month, day };
}

/** `null`/`undefined` input means "birth time unknown" and is a fully valid, first-class result
 * (Module 13 §5/§14/§16) — returns `null`, never throws. A non-empty but malformed value does
 * throw, since that's a real input error, not an intentional omission. */
export function normalizeBirthTime(input: string | null | undefined): NormalizedBirthTime | null {
  if (input === null || input === undefined || input.trim() === '') return null;

  const match = ISO_TIME_PATTERN.exec(input.trim());
  if (!match) {
    throw new BirthInputValidationError('NATAL_CHART_INVALID_TIME_FORMAT', 'Birth time must be in 24-hour HH:mm format.');
  }

  return { iso: `${match[1]}:${match[2]}`, hour: Number(match[1]), minute: Number(match[2]) };
}
