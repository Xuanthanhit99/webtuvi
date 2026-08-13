import { BirthInputValidationError, NATAL_CHART_MIN_BIRTH_YEAR, normalizeBirthDate, normalizeBirthTime } from './natal-chart-birth-input.util';

const FIXED_NOW = new Date('2026-08-11T12:00:00.000Z');

describe('normalizeBirthDate', () => {
  it('parses a valid YYYY-MM-DD date', () => {
    expect(normalizeBirthDate('1995-08-17', FIXED_NOW)).toEqual({ iso: '1995-08-17', year: 1995, month: 8, day: 17 });
  });

  it('is a pure function — repeated calls produce identical output', () => {
    expect(normalizeBirthDate('1995-08-17', FIXED_NOW)).toEqual(normalizeBirthDate('1995-08-17', FIXED_NOW));
  });

  it('rejects malformed date strings', () => {
    for (const bad of ['1995/08/17', '17-08-1995', 'not-a-date', '1995-8-17', '']) {
      expect(() => normalizeBirthDate(bad, FIXED_NOW)).toThrow(BirthInputValidationError);
    }
  });

  it('rejects impossible calendar dates without silently correcting them', () => {
    expect(() => normalizeBirthDate('2024-02-30', FIXED_NOW)).toThrow(BirthInputValidationError);
    try {
      normalizeBirthDate('2024-02-30', FIXED_NOW);
    } catch (error) {
      expect((error as BirthInputValidationError).code).toBe('NATAL_CHART_INVALID_CALENDAR_DATE');
    }
  });

  it('accepts a real leap-day date', () => {
    expect(normalizeBirthDate('2000-02-29', FIXED_NOW).iso).toBe('2000-02-29');
  });

  it('rejects future dates', () => {
    expect(() => normalizeBirthDate('2026-08-12', FIXED_NOW)).toThrow(BirthInputValidationError);
    try {
      normalizeBirthDate('2026-08-12', FIXED_NOW);
    } catch (error) {
      expect((error as BirthInputValidationError).code).toBe('NATAL_CHART_FUTURE_DATE_NOT_ALLOWED');
    }
  });

  it('accepts today exactly', () => {
    expect(normalizeBirthDate('2026-08-11', FIXED_NOW).iso).toBe('2026-08-11');
  });

  it(`rejects birth years before ${NATAL_CHART_MIN_BIRTH_YEAR}`, () => {
    expect(() => normalizeBirthDate('1899-12-31', FIXED_NOW)).toThrow(BirthInputValidationError);
    try {
      normalizeBirthDate('1899-12-31', FIXED_NOW);
    } catch (error) {
      expect((error as BirthInputValidationError).code).toBe('NATAL_CHART_DATE_TOO_OLD');
    }
  });
});

describe('normalizeBirthTime', () => {
  it('returns null for null/undefined/empty input — birth time unknown is a valid, intentional result', () => {
    expect(normalizeBirthTime(null)).toBeNull();
    expect(normalizeBirthTime(undefined)).toBeNull();
    expect(normalizeBirthTime('')).toBeNull();
    expect(normalizeBirthTime('   ')).toBeNull();
  });

  it('parses a valid 24-hour HH:mm time', () => {
    expect(normalizeBirthTime('14:30')).toEqual({ iso: '14:30', hour: 14, minute: 30 });
  });

  it('accepts midnight and one-minute-before-midnight boundaries', () => {
    expect(normalizeBirthTime('00:00')).toEqual({ iso: '00:00', hour: 0, minute: 0 });
    expect(normalizeBirthTime('23:59')).toEqual({ iso: '23:59', hour: 23, minute: 59 });
  });

  it('rejects malformed or out-of-range times rather than silently guessing', () => {
    for (const bad of ['24:00', '12:60', '1:30', '12:5', 'noon', '12-30']) {
      expect(() => normalizeBirthTime(bad)).toThrow(BirthInputValidationError);
    }
  });
});
