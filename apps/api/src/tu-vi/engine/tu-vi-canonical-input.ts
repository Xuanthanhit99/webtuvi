/**
 * Sprint 18B.1 — canonical birth-input parsing and validation for the Tử Vi engine.
 *
 * V1's input contract is Gregorian-only at the API boundary (`calculation-specification.md` §1's
 * pipeline starts from "Birth data (solar date, time, location)"; no lunar-input mode is specified
 * anywhere in the frozen ruleset — a lunar-input mode is deliberately NOT introduced here). Birth
 * time is REQUIRED, not optional (`calculation-specification.md` §11 — it is the direct source of
 * the giờ Tý ambiguity this engine must resolve deterministically, see `tu-vi-hour-branch.ts`).
 * Birth location/timezone selection is NOT collected — V1 is fixed to Vietnam UTC+7
 * (`canonical-ruleset-v1.md` §1, `TUVI-CAL-02`), unlike Natal Chart's geo-derived timezone.
 */

export class TuViBirthInputValidationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'TuViBirthInputValidationError';
  }
}

/** Same bounds discipline as Eastern Horoscope/Numerology/Natal Chart's own date validators. */
const MIN_BIRTH_YEAR = 1900;

/** `'Nam'` (male) or `'Nữ'` (female) — VDTTL-1956's own binary sex categories, used only where a
 * specific rule is genuinely sex-dependent (Hỏa Tinh/Linh Tinh, `tu-vi-core13.ts` — the sole
 * CORE_13 rule requiring it; no calendar/Mệnh/Thân/Cục/main-star rule reads this field). */
export type TuViSex = 'Nam' | 'Nữ';

export interface TuViBirthInput {
  /** `YYYY-MM-DD`, Gregorian calendar. */
  birthDate: string;
  /** `HH:mm`, 24-hour, local Vietnam wall-clock time. */
  birthTime: string;
  /**
   * Optional at this type's level (added Sprint 18B.5, additive/non-breaking — every phase before
   * 18B.5 works with or without it) because most V1 rules do not consume it at all. Individual
   * downstream functions that DO need it (only `calculateCore13Stars`'s Hỏa Tinh/Linh Tinh path)
   * validate its presence themselves and throw a clear, specific error if missing, rather than
   * silently defaulting.
   */
  sex?: TuViSex;
}

export interface TuViParsedBirthInput {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  sex?: TuViSex;
}

export interface ParseTuViBirthInputOptions {
  /** Injectable for deterministic tests; defaults to the real current time. */
  now?: Date;
}

function parseBirthDatePart(birthDate: string): { year: number; month: number; day: number } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate);
  if (!match) {
    throw new TuViBirthInputValidationError('Birth date must be in YYYY-MM-DD format.', 'TUVI_INVALID_DATE_FORMAT');
  }
  const [, yearStr, monthStr, dayStr] = match;
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  // Round-trip through Date.UTC to reject dates that don't exist (e.g. 2025-02-31) rather than
  // letting native Date silently normalize them into a different, valid date (2025-03-03). Same
  // technique as eastern-horoscope-engine.ts's parseBirthDate and numerology-date.util.ts's
  // normalizeBirthDate — reused deliberately for consistency with the rest of the codebase, not
  // reinvented. This is the exact case Sprint 18B.1's stop condition F names explicitly.
  const probe = new Date(Date.UTC(year, month - 1, day));
  const isRealCalendarDate = probe.getUTCFullYear() === year && probe.getUTCMonth() === month - 1 && probe.getUTCDate() === day;
  if (!isRealCalendarDate) {
    throw new TuViBirthInputValidationError('Birth date is not a real calendar date.', 'TUVI_INVALID_DATE');
  }
  if (year < MIN_BIRTH_YEAR) {
    throw new TuViBirthInputValidationError(`Birth year must be ${MIN_BIRTH_YEAR} or later.`, 'TUVI_DATE_OUT_OF_RANGE');
  }
  return { year, month, day };
}

function parseBirthTimePart(birthTime: string): { hour: number; minute: number } {
  const match = /^(\d{2}):(\d{2})$/.exec(birthTime);
  if (!match) {
    throw new TuViBirthInputValidationError('Birth time must be in HH:mm (24-hour) format.', 'TUVI_INVALID_TIME_FORMAT');
  }
  const [, hourStr, minuteStr] = match;
  const hour = Number(hourStr);
  const minute = Number(minuteStr);
  if (hour > 23 || minute > 59) {
    throw new TuViBirthInputValidationError('Birth time must be a real 24-hour clock time (00:00–23:59).', 'TUVI_INVALID_TIME');
  }
  return { hour, minute };
}

/** Parses and validates a canonical Tử Vi birth input. Throws `TuViBirthInputValidationError`
 * (never silently coerces) for any malformed or impossible date/time. */
export function parseTuViBirthInput(input: TuViBirthInput, options: ParseTuViBirthInputOptions = {}): TuViParsedBirthInput {
  const { year, month, day } = parseBirthDatePart(input.birthDate);
  const { hour, minute } = parseBirthTimePart(input.birthTime);

  const now = options.now ?? new Date();
  const asUtc = new Date(Date.UTC(year, month - 1, day, hour, minute));
  if (asUtc.getTime() > now.getTime()) {
    throw new TuViBirthInputValidationError('Birth date/time cannot be in the future.', 'TUVI_DATE_IN_FUTURE');
  }

  return { year, month, day, hour, minute, sex: input.sex };
}
