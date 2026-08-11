import { BirthDateValidationError, MIN_BIRTH_YEAR, normalizeBirthDate } from './numerology-date.util';

const FIXED_NOW = new Date('2026-08-11T12:00:00.000Z');

describe('normalizeBirthDate', () => {
  it('parses a valid YYYY-MM-DD date', () => {
    const result = normalizeBirthDate('1995-08-17', FIXED_NOW);
    expect(result).toEqual({ iso: '1995-08-17', year: 1995, month: 8, day: 17 });
  });

  it('is a pure function — repeated calls produce identical output', () => {
    expect(normalizeBirthDate('1995-08-17', FIXED_NOW)).toEqual(normalizeBirthDate('1995-08-17', FIXED_NOW));
  });

  it('rejects malformed date strings', () => {
    for (const bad of ['1995/08/17', '17-08-1995', 'not-a-date', '1995-8-17', '']) {
      expect(() => normalizeBirthDate(bad, FIXED_NOW)).toThrow(BirthDateValidationError);
    }
  });

  it('rejects impossible calendar dates without silently correcting them', () => {
    // JS Date would silently roll 2024-02-30 into 2024-03-01 — this must be rejected instead.
    expect(() => normalizeBirthDate('2024-02-30', FIXED_NOW)).toThrow(BirthDateValidationError);
    try {
      normalizeBirthDate('2024-02-30', FIXED_NOW);
    } catch (error) {
      expect((error as BirthDateValidationError).code).toBe('NUMEROLOGY_INVALID_CALENDAR_DATE');
    }
  });

  it('rejects month/day out of range', () => {
    expect(() => normalizeBirthDate('1995-13-01', FIXED_NOW)).toThrow(BirthDateValidationError);
    expect(() => normalizeBirthDate('1995-00-10', FIXED_NOW)).toThrow(BirthDateValidationError);
    expect(() => normalizeBirthDate('1995-04-31', FIXED_NOW)).toThrow(BirthDateValidationError);
  });

  it('accepts a real leap-day date', () => {
    expect(normalizeBirthDate('2000-02-29', FIXED_NOW).iso).toBe('2000-02-29');
  });

  it('rejects future dates', () => {
    expect(() => normalizeBirthDate('2026-08-12', FIXED_NOW)).toThrow(BirthDateValidationError);
    try {
      normalizeBirthDate('2026-08-12', FIXED_NOW);
    } catch (error) {
      expect((error as BirthDateValidationError).code).toBe('NUMEROLOGY_FUTURE_DATE_NOT_ALLOWED');
    }
  });

  it('accepts today exactly', () => {
    expect(normalizeBirthDate('2026-08-11', FIXED_NOW).iso).toBe('2026-08-11');
  });

  it(`rejects birth years before ${MIN_BIRTH_YEAR}`, () => {
    expect(() => normalizeBirthDate('1899-12-31', FIXED_NOW)).toThrow(BirthDateValidationError);
    try {
      normalizeBirthDate('1899-12-31', FIXED_NOW);
    } catch (error) {
      expect((error as BirthDateValidationError).code).toBe('NUMEROLOGY_DATE_TOO_OLD');
    }
  });

  it(`accepts exactly the minimum birth year ${MIN_BIRTH_YEAR}`, () => {
    expect(normalizeBirthDate(`${MIN_BIRTH_YEAR}-01-01`, FIXED_NOW).iso).toBe(`${MIN_BIRTH_YEAR}-01-01`);
  });
});
