import { BirthDateValidationError } from './numerology-date.util';
import { calculateNumerology, NUMEROLOGY_ENGINE_VERSION } from './numerology-engine';
import { NameValidationError } from './numerology-name.util';

const FIXED_NOW = new Date('2026-08-11T12:00:00.000Z');

describe('calculateNumerology — golden vector: "Nguyen Van A", 1995-08-17, calculated 2026', () => {
  const result = calculateNumerology({ fullBirthName: 'Nguyen Van A', birthDate: '1995-08-17' }, { now: FIXED_NOW });

  it('stamps the engine version and preserves the raw + normalized input', () => {
    expect(result.engineVersion).toBe(NUMEROLOGY_ENGINE_VERSION);
    expect(result.input).toEqual({ fullBirthName: 'Nguyen Van A', birthDate: '1995-08-17' });
    expect(result.normalizedInput).toEqual({ birthName: 'NGUYEN VAN A', birthDate: '1995-08-17' });
  });

  it('computes Life Path as a Master Number (22) — month 8 + day 17->8 + year 1995->6 = 22', () => {
    expect(result.values.LIFE_PATH.value).toBe(22);
    expect(result.values.LIFE_PATH.isMasterNumber).toBe(true);
    expect(result.values.LIFE_PATH.breakdown.total).toBe(22);
    expect(result.values.LIFE_PATH.breakdown.components.map((c) => c.reduction.value)).toEqual([8, 8, 6]);
  });

  it('computes Birthday Number from the day component alone (17 -> 8)', () => {
    expect(result.values.BIRTHDAY.value).toBe(8);
    expect(result.values.BIRTHDAY.isMasterNumber).toBe(false);
    expect(result.values.BIRTHDAY.breakdown.reduction.steps).toEqual([{ from: 17, digits: [1, 7], to: 8 }]);
  });

  it('computes Expression Number from every letter in the normalized name (43 -> 7)', () => {
    expect(result.values.EXPRESSION.value).toBe(7);
    expect(result.values.EXPRESSION.isMasterNumber).toBe(false);
    expect(result.values.EXPRESSION.breakdown.sum).toBe(43);
    expect(result.values.EXPRESSION.breakdown.normalizedName).toBe('NGUYEN VAN A');
  });

  it('computes Soul Urge Number from vowels only (U+E+A+A=10 -> 1)', () => {
    expect(result.values.SOUL_URGE.value).toBe(1);
    expect(result.values.SOUL_URGE.breakdown.letters.map((l) => l.char)).toEqual(['U', 'E', 'A', 'A']);
  });

  it('computes Personality Number from consonants only, landing exactly on a Master Number (33)', () => {
    expect(result.values.PERSONALITY.value).toBe(33);
    expect(result.values.PERSONALITY.isMasterNumber).toBe(true);
    expect(result.values.PERSONALITY.breakdown.letters.map((l) => l.char)).toEqual(['N', 'G', 'Y', 'N', 'V', 'N']);
    expect(result.values.PERSONALITY.breakdown.sum).toBe(33);
  });

  it('computes Personal Year for the calendar year the calculation runs in (2026: 8+8+1=17 -> 8)', () => {
    expect(result.personalYearAppliesTo).toBe(2026);
    expect(result.values.PERSONAL_YEAR.value).toBe(8);
    expect(result.values.PERSONAL_YEAR.isMasterNumber).toBe(false);
  });

  it('Soul Urge + Personality letter counts add up to Expression letter count (mutually exclusive partition)', () => {
    expect(result.values.SOUL_URGE.breakdown.letters.length + result.values.PERSONALITY.breakdown.letters.length).toBe(
      result.values.EXPRESSION.breakdown.letters.length,
    );
  });
});

describe('calculateNumerology — reproducibility', () => {
  it('the same normalized input always produces an identical result', () => {
    const a = calculateNumerology({ fullBirthName: 'Nguyễn Văn Ánh', birthDate: '1990-01-05' }, { now: FIXED_NOW });
    const b = calculateNumerology({ fullBirthName: 'Nguyễn Văn Ánh', birthDate: '1990-01-05' }, { now: FIXED_NOW });
    expect(a).toEqual(b);
  });

  it('different raw spelling that normalizes identically (diacritics vs. plain ASCII) yields the same core numbers', () => {
    const withDiacritics = calculateNumerology({ fullBirthName: 'Nguyễn Văn Ánh', birthDate: '1990-01-05' }, { now: FIXED_NOW });
    const plainAscii = calculateNumerology({ fullBirthName: 'Nguyen Van Anh', birthDate: '1990-01-05' }, { now: FIXED_NOW });
    expect(withDiacritics.values.LIFE_PATH.value).toBe(plainAscii.values.LIFE_PATH.value);
    expect(withDiacritics.values.EXPRESSION.value).toBe(plainAscii.values.EXPRESSION.value);
  });
});

describe('calculateNumerology — validation errors never produce a partial result', () => {
  it('propagates BirthDateValidationError for an invalid date', () => {
    expect(() => calculateNumerology({ fullBirthName: 'Jane Doe', birthDate: '2099-01-01' }, { now: FIXED_NOW })).toThrow(
      BirthDateValidationError,
    );
  });

  it('propagates NameValidationError for an empty name', () => {
    expect(() => calculateNumerology({ fullBirthName: '', birthDate: '1990-01-01' }, { now: FIXED_NOW })).toThrow(NameValidationError);
  });

  it('propagates NameValidationError for a name with no transliterable letters', () => {
    expect(() => calculateNumerology({ fullBirthName: '田中太郎', birthDate: '1990-01-01' }, { now: FIXED_NOW })).toThrow(
      NameValidationError,
    );
  });
});
