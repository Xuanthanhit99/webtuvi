import { parseTuViBirthInput, TuViBirthInputValidationError } from './tu-vi-canonical-input';

describe('parseTuViBirthInput — Gregorian date validation', () => {
  it('accepts a valid normal date', () => {
    const result = parseTuViBirthInput({ birthDate: '1990-06-15', birthTime: '10:30' });
    expect(result).toEqual({ year: 1990, month: 6, day: 15, hour: 10, minute: 30 });
  });

  it('accepts a valid leap day (2024-02-29 — 2024 is a leap year)', () => {
    const result = parseTuViBirthInput({ birthDate: '2024-02-29', birthTime: '00:00' });
    expect(result).toEqual({ year: 2024, month: 2, day: 29, hour: 0, minute: 0 });
  });

  it('rejects an invalid leap day (2023-02-29 — 2023 is not a leap year)', () => {
    expect(() => parseTuViBirthInput({ birthDate: '2023-02-29', birthTime: '12:00' })).toThrow(TuViBirthInputValidationError);
    try {
      parseTuViBirthInput({ birthDate: '2023-02-29', birthTime: '12:00' });
      fail('expected to throw');
    } catch (e) {
      expect((e as TuViBirthInputValidationError).code).toBe('TUVI_INVALID_DATE');
    }
  });

  it('rejects an impossible day (2025-02-31) WITHOUT silently normalizing it to a different valid date', () => {
    // This is the exact case Sprint 18B.1's stop condition F names: native `new Date(2025, 1, 31)`
    // would silently roll over to 2025-03-03. This must throw instead.
    expect(() => parseTuViBirthInput({ birthDate: '2025-02-31', birthTime: '12:00' })).toThrow(TuViBirthInputValidationError);
  });

  it('rejects an impossible day for a 30-day month (2025-04-31)', () => {
    expect(() => parseTuViBirthInput({ birthDate: '2025-04-31', birthTime: '12:00' })).toThrow(TuViBirthInputValidationError);
  });

  it('rejects an invalid month (2025-13-01)', () => {
    expect(() => parseTuViBirthInput({ birthDate: '2025-13-01', birthTime: '12:00' })).toThrow(TuViBirthInputValidationError);
  });

  it('rejects a malformed date string', () => {
    expect(() => parseTuViBirthInput({ birthDate: '15-06-1990', birthTime: '12:00' })).toThrow(TuViBirthInputValidationError);
    try {
      parseTuViBirthInput({ birthDate: '15-06-1990', birthTime: '12:00' });
      fail('expected to throw');
    } catch (e) {
      expect((e as TuViBirthInputValidationError).code).toBe('TUVI_INVALID_DATE_FORMAT');
    }
  });

  it('rejects a year before MIN_BIRTH_YEAR (1899)', () => {
    expect(() => parseTuViBirthInput({ birthDate: '1899-01-01', birthTime: '12:00' })).toThrow(TuViBirthInputValidationError);
  });

  it('accepts the MIN_BIRTH_YEAR boundary itself (1900)', () => {
    expect(() => parseTuViBirthInput({ birthDate: '1900-01-01', birthTime: '12:00' })).not.toThrow();
  });
});

describe('parseTuViBirthInput — time validation', () => {
  it('rejects a malformed time string', () => {
    expect(() => parseTuViBirthInput({ birthDate: '1990-06-15', birthTime: '10.30' })).toThrow(TuViBirthInputValidationError);
    try {
      parseTuViBirthInput({ birthDate: '1990-06-15', birthTime: '10.30' });
      fail('expected to throw');
    } catch (e) {
      expect((e as TuViBirthInputValidationError).code).toBe('TUVI_INVALID_TIME_FORMAT');
    }
  });

  it('rejects an out-of-range hour (25:00)', () => {
    expect(() => parseTuViBirthInput({ birthDate: '1990-06-15', birthTime: '25:00' })).toThrow(TuViBirthInputValidationError);
  });

  it('rejects an out-of-range minute (12:60)', () => {
    expect(() => parseTuViBirthInput({ birthDate: '1990-06-15', birthTime: '12:60' })).toThrow(TuViBirthInputValidationError);
  });

  it('accepts the exact boundary times 00:00 and 23:59', () => {
    expect(() => parseTuViBirthInput({ birthDate: '1990-06-15', birthTime: '00:00' })).not.toThrow();
    expect(() => parseTuViBirthInput({ birthDate: '1990-06-15', birthTime: '23:59' })).not.toThrow();
  });
});

describe('parseTuViBirthInput — future-date rejection', () => {
  it('rejects a birth date/time after the injected `now`', () => {
    const now = new Date('2026-08-21T00:00:00.000Z');
    expect(() => parseTuViBirthInput({ birthDate: '2026-08-22', birthTime: '00:00' }, { now })).toThrow(TuViBirthInputValidationError);
  });

  it('accepts a birth date/time exactly at (not after) the injected `now`', () => {
    const now = new Date(Date.UTC(2026, 7, 21, 12, 0));
    expect(() => parseTuViBirthInput({ birthDate: '2026-08-21', birthTime: '12:00' }, { now })).not.toThrow();
  });
});
