import { LETTER_VALUES, NameValidationError, normalizeName, sumNameLetters, VOWELS } from './numerology-name.util';

describe('LETTER_VALUES', () => {
  it('assigns every letter A-Z a value 1-9 following the standard Pythagorean cycle', () => {
    expect(LETTER_VALUES['A']).toBe(1);
    expect(LETTER_VALUES['J']).toBe(1);
    expect(LETTER_VALUES['S']).toBe(1);
    expect(LETTER_VALUES['I']).toBe(9);
    expect(LETTER_VALUES['R']).toBe(9);
    for (const code of Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))) {
      expect(LETTER_VALUES[code]).toBeGreaterThanOrEqual(1);
      expect(LETTER_VALUES[code]).toBeLessThanOrEqual(9);
    }
  });

  it('treats Y as a consonant, not a vowel (documented convention)', () => {
    expect(VOWELS.has('Y')).toBe(false);
  });
});

describe('normalizeName', () => {
  it('trims, collapses whitespace, and upper-cases a plain ASCII name', () => {
    const result = normalizeName('  jane   doe  ');
    expect(result.display).toBe('JANE DOE');
    expect(result.lettersOnly).toBe('JANEDOE');
  });

  it('strips Vietnamese diacritics via NFD decomposition', () => {
    const result = normalizeName('Nguyễn Văn Ánh');
    expect(result.display).toBe('NGUYEN VAN ANH');
    expect(result.lettersOnly).toBe('NGUYENVANANH');
  });

  it('maps đ/Đ to d/D explicitly (does not decompose under NFD)', () => {
    const result = normalizeName('Đặng Thị Đức');
    expect(result.display).toBe('DANG THI DUC');
    expect(result.lettersOnly).toBe('DANGTHIDUC');
  });

  it('drops punctuation (hyphens, apostrophes, periods) from lettersOnly but keeps letters', () => {
    const result = normalizeName("Mary-Jane O'Brien Jr.");
    expect(result.lettersOnly).toBe('MARYJANEOBRIENJR');
  });

  it('throws NUMEROLOGY_NAME_EMPTY for an empty or whitespace-only name', () => {
    expect(() => normalizeName('')).toThrow(NameValidationError);
    expect(() => normalizeName('   ')).toThrow(NameValidationError);
    try {
      normalizeName('');
    } catch (error) {
      expect((error as NameValidationError).code).toBe('NUMEROLOGY_NAME_EMPTY');
    }
  });

  it('throws NUMEROLOGY_NAME_TRANSLITERATION_UNSUPPORTED for scripts with no Latin-letter reduction', () => {
    expect(() => normalizeName('田中太郎')).toThrow(NameValidationError);
    try {
      normalizeName('田中太郎');
    } catch (error) {
      expect((error as NameValidationError).code).toBe('NUMEROLOGY_NAME_TRANSLITERATION_UNSUPPORTED');
    }
  });

  it('is a pure function — repeated calls with the same input produce identical output', () => {
    expect(normalizeName('Nguyễn Văn Ánh')).toEqual(normalizeName('Nguyễn Văn Ánh'));
  });
});

describe('sumNameLetters', () => {
  it('golden vector: NGUYEN VAN ANH — ALL/VOWELS/CONSONANTS sums are correct and mutually exclusive', () => {
    const normalized = normalizeName('Nguyen Van Anh');
    const all = sumNameLetters(normalized, 'ALL');
    const vowels = sumNameLetters(normalized, 'VOWELS');
    const consonants = sumNameLetters(normalized, 'CONSONANTS');

    expect(all.letters).toHaveLength(normalized.lettersOnly.length);
    expect(vowels.letters.length + consonants.letters.length).toBe(all.letters.length);
    expect(vowels.sum + consonants.sum).toBe(all.sum);
    expect(vowels.letters.every((l) => VOWELS.has(l.char))).toBe(true);
    expect(consonants.letters.every((l) => !VOWELS.has(l.char))).toBe(true);
  });

  it('golden vector: NGUYENVANA letter sums match hand-computed values', () => {
    // N=5 G=7 U=3 Y=7 E=5 N=5 V=4 A=1 N=5 A=1
    const normalized = normalizeName('Nguyen Van A');
    expect(normalized.lettersOnly).toBe('NGUYENVANA');
    const all = sumNameLetters(normalized, 'ALL');
    expect(all.sum).toBe(5 + 7 + 3 + 7 + 5 + 5 + 4 + 1 + 5 + 1);

    const vowels = sumNameLetters(normalized, 'VOWELS');
    // U=3, E=5, A=1, A=1
    expect(vowels.sum).toBe(3 + 5 + 1 + 1);

    const consonants = sumNameLetters(normalized, 'CONSONANTS');
    // N=5 G=7 Y=7 N=5 V=4 N=5
    expect(consonants.sum).toBe(5 + 7 + 7 + 5 + 4 + 5);
  });
});
