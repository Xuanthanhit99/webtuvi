import {
  calculateEasternHoroscope,
  BirthDateValidationError,
  EASTERN_HOROSCOPE_ENGINE_VERSION,
  EASTERN_HOROSCOPE_CALENDAR_VERSION,
  EASTERN_HOROSCOPE_RULESET_VERSION,
  EASTERN_HOROSCOPE_YEAR_BOUNDARY,
  EASTERN_HOROSCOPE_ELEMENT_SYSTEM,
} from './eastern-horoscope-engine';

const FIXED_NOW = new Date('2024-06-15T12:00:00.000Z'); // lunar year 2024 (Giáp Thìn)

describe('calculateEasternHoroscope — golden vector: 2024-03-01 birth, viewed in lunar year 2024', () => {
  const result = calculateEasternHoroscope({ birthDate: '2024-03-01' }, { now: FIXED_NOW });

  it('stamps all three version identifiers and the locked ruleset flags', () => {
    expect(result.engineVersion).toBe(EASTERN_HOROSCOPE_ENGINE_VERSION);
    expect(result.calendarVersion).toBe(EASTERN_HOROSCOPE_CALENDAR_VERSION);
    expect(result.rulesetVersion).toBe(EASTERN_HOROSCOPE_RULESET_VERSION);
    expect(result.yearBoundary).toBe('LUNAR_NEW_YEAR');
    expect(result.elementSystem).toBe('HEAVENLY_STEM_ELEMENT');
    expect(EASTERN_HOROSCOPE_YEAR_BOUNDARY).toBe('LUNAR_NEW_YEAR');
    expect(EASTERN_HOROSCOPE_ELEMENT_SYSTEM).toBe('HEAVENLY_STEM_ELEMENT');
  });

  it('computes the correct birth profile: Giáp Thìn, Dragon, Wood, Yang', () => {
    expect(result.birthProfile.lunarYear).toBe(2024);
    expect(result.birthProfile.stem).toBe('Giáp');
    expect(result.birthProfile.branch).toBe('Thìn');
    expect(result.birthProfile.element).toBe('Mộc');
    expect(result.birthProfile.yinYang).toBe('Dương');
    expect(result.birthProfile.zodiacAnimal.en).toBe('Dragon');
  });

  it('computes Year Energy as SAME when viewed within the birth year itself', () => {
    expect(result.yearEnergy.calendarYear).toBe(2024);
    expect(result.yearEnergy.yearElement).toBe('Mộc');
    expect(result.yearEnergy.relationship).toBe('SAME');
  });
});

describe('calculateEasternHoroscope — Year Energy differs from birth profile in a different lunar year', () => {
  it('a Giáp Thìn (Wood) person viewed during a Quý Mão (Water) year sees GENERATES (the fixed cycle: Water generates Wood)', () => {
    const result = calculateEasternHoroscope({ birthDate: '2024-03-01' }, { now: new Date('2023-06-15T12:00:00.000Z') });
    expect(result.birthProfile.element).toBe('Mộc');
    expect(result.yearEnergy.yearElement).toBe('Thủy');
    expect(result.yearEnergy.relationship).toBe('GENERATES');
  });
});

describe('calculateEasternHoroscope — boundary vectors B1–B5 (docs/domain/eastern-horoscope-rules.md §8a) flow through the full engine', () => {
  it('B1: birth on 2024-02-09 (day before Tết) resolves to lunar year 2023, Quý Mão', () => {
    const result = calculateEasternHoroscope({ birthDate: '2024-02-09' }, { now: FIXED_NOW });
    expect(result.birthProfile.lunarYear).toBe(2023);
    expect(result.birthProfile.stem).toBe('Quý');
    expect(result.birthProfile.branch).toBe('Mão');
  });

  it('B2: birth on 2024-02-10 (Tết itself) resolves to lunar year 2024, Giáp Thìn', () => {
    const result = calculateEasternHoroscope({ birthDate: '2024-02-10' }, { now: FIXED_NOW });
    expect(result.birthProfile.lunarYear).toBe(2024);
    expect(result.birthProfile.stem).toBe('Giáp');
  });

  it('B4: birth on 2024-01-01 (Gregorian Jan 1) does NOT change the zodiac year — still 2023', () => {
    const result = calculateEasternHoroscope({ birthDate: '2024-01-01' }, { now: FIXED_NOW });
    expect(result.birthProfile.lunarYear).toBe(2023);
  });

  it('B5: birth on 2015-02-10 (after Lập Xuân, before Tết) stays in lunar year 2014, proving LUNAR_NEW_YEAR (not Lập Xuân) governs', () => {
    const result = calculateEasternHoroscope({ birthDate: '2015-02-10' }, { now: FIXED_NOW });
    expect(result.birthProfile.lunarYear).toBe(2014);
    expect(result.birthProfile.stem).toBe('Giáp');
    expect(result.birthProfile.branch).toBe('Ngọ');
  });
});

describe('calculateEasternHoroscope — input validation, never a partial/guessed result', () => {
  it('rejects a malformed date format', () => {
    expect(() => calculateEasternHoroscope({ birthDate: '2024/02/10' })).toThrow(BirthDateValidationError);
  });

  it('rejects a non-existent calendar date', () => {
    expect(() => calculateEasternHoroscope({ birthDate: '2024-02-30' })).toThrow(BirthDateValidationError);
  });

  it('rejects a birth year before the supported range', () => {
    expect(() => calculateEasternHoroscope({ birthDate: '1899-01-01' })).toThrow(BirthDateValidationError);
  });

  it('rejects a future birth date', () => {
    expect(() => calculateEasternHoroscope({ birthDate: '2099-01-01' }, { now: FIXED_NOW })).toThrow(BirthDateValidationError);
  });
});
