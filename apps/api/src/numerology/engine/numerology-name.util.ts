/**
 * Phase 5 — the one authoritative name-to-number mapping. Product Bible Module 15 §17 requires "a
 * documented, tested transliteration approach" for diacritics/non-Latin input; this module is that
 * approach — no OCR, no external transliteration service (Sprint 8 brief, Phase 5), just a
 * deterministic, documented character mapping.
 *
 * Convention decisions (documented — the standard Pythagorean letter table below is not spelled out
 * digit-by-digit in the Product Bible, so this file is the single source of truth for it):
 * - Standard Pythagorean A-Z -> 1-9 cycle (A,J,S=1 ... I,R=9).
 * - Vietnamese diacritics are stripped via Unicode NFD decomposition plus an explicit đ/Đ -> d/D
 *   map (đ does not decompose under NFD, unlike marks such as ă/â/ê/ô/ơ/ư).
 * - Vowels are exactly A, E, I, O, U. Y is always treated as a consonant — the traditional "Y is a
 *   vowel only when it carries a syllable's vowel sound" rule is not algorithmically deterministic
 *   without a pronunciation dictionary, so this product intentionally does not implement it. This
 *   is a disclosed simplification, applied consistently for every user.
 * - Characters that are not Latin letters after normalization (spaces, hyphens, apostrophes,
 *   periods, and any character from a non-Latin script that NFD cannot reduce to a Latin letter)
 *   are dropped from letter-value sums entirely — they carry no numeric value, but are preserved in
 *   the normalized display name so a user can see exactly what was calculated from.
 */

export const LETTER_VALUES: Readonly<Record<string, number>> = {
  A: 1, J: 1, S: 1,
  B: 2, K: 2, T: 2,
  C: 3, L: 3, U: 3,
  D: 4, M: 4, V: 4,
  E: 5, N: 5, W: 5,
  F: 6, O: 6, X: 6,
  G: 7, P: 7, Y: 7,
  H: 8, Q: 8, Z: 8,
  I: 9, R: 9,
};

export const VOWELS = new Set(['A', 'E', 'I', 'O', 'U']);

export const NUMEROLOGY_NAME_NORMALIZATION_VERSION = 'numerology-name-normalization-v1';

export interface NormalizedName {
  /** Trimmed, whitespace-collapsed, diacritic-stripped, upper-cased — what the user actually typed,
   * made calculable, and safe to show back to them so no name gets silently altered without proof
   * of what was used (Sprint 8 brief, Phase 2). */
  display: string;
  /** `display` with every non-A-Z character removed — the exact ordered sequence letter-value sums
   * are computed from. */
  lettersOnly: string;
}

/** Allowed raw-input characters: any Unicode letter or combining mark (covers Vietnamese and other
 * accented Latin input typed as precomposed characters), plus space, hyphen, apostrophe, and
 * period. Digits, emoji, and other symbols are rejected at the validation layer, not silently
 * dropped here. */
export const NUMEROLOGY_NAME_PATTERN = /^[\p{L}\p{M} .'-]+$/u;

/** Unicode combining-diacritical-marks block (U+0300-U+036F) — what NFD decomposition splits
 * accented Latin characters into (e.g. "ế" -> "e" + U+0302 + U+0301). Built via `RegExp` from an
 * escaped code-point range rather than a literal character class to keep this file's source bytes
 * unambiguous. */
const COMBINING_MARKS = new RegExp('[\\u0300-\\u036f]', 'g');

export type NameValidationErrorCode = 'NUMEROLOGY_NAME_EMPTY' | 'NUMEROLOGY_NAME_TRANSLITERATION_UNSUPPORTED';

export class NameValidationError extends Error {
  constructor(public readonly code: NameValidationErrorCode, message: string) {
    super(message);
    this.name = 'NameValidationError';
  }
}

/** Normalizes and validates in one step: throws `NameValidationError` (never silently proceeds)
 * when nothing calculable survives normalization — most commonly a name written in a script this
 * product's diacritic-stripping approach cannot reduce to Latin letters (e.g. Chinese, Cyrillic,
 * Arabic), the honest limitation disclosed in docs/architecture/numerology-discovery.md. */
export function normalizeName(rawName: string): NormalizedName {
  const collapsedWhitespace = rawName.trim().replace(/\s+/g, ' ');
  if (collapsedWhitespace.length === 0) {
    throw new NameValidationError('NUMEROLOGY_NAME_EMPTY', 'Full birth name is required.');
  }

  const dStrokeMapped = collapsedWhitespace.replace(/đ/g, 'd').replace(/Đ/g, 'D');
  const diacriticsStripped = dStrokeMapped.normalize('NFD').replace(COMBINING_MARKS, '');
  const display = diacriticsStripped.toUpperCase();
  const lettersOnly = display.replace(/[^A-Z]/g, '');

  if (lettersOnly.length === 0) {
    throw new NameValidationError(
      'NUMEROLOGY_NAME_TRANSLITERATION_UNSUPPORTED',
      'We can’t calculate a name-based number for this name yet — please enter it using Latin or Vietnamese letters.',
    );
  }

  return { display, lettersOnly };
}

export interface LetterValue {
  char: string;
  value: number;
}

export interface NameNumberBreakdown {
  normalizedName: string;
  /** Only the letters actually counted for this number type (all letters, vowels only, or
   * consonants only depending on caller), in the order they appear in the normalized name. */
  letters: LetterValue[];
  sum: number;
}

function lettersFor(normalized: NormalizedName, filter: 'ALL' | 'VOWELS' | 'CONSONANTS'): LetterValue[] {
  return normalized.lettersOnly
    .split('')
    .filter((char) => {
      if (filter === 'ALL') return true;
      const isVowel = VOWELS.has(char);
      return filter === 'VOWELS' ? isVowel : !isVowel;
    })
    .map((char) => ({ char, value: LETTER_VALUES[char]! }));
}

/** Sums the letter values for the requested subset of a normalized name. Pure function — the
 * caller (the engine) is responsible for running this through `reduceToCoreNumber`. */
export function sumNameLetters(normalized: NormalizedName, filter: 'ALL' | 'VOWELS' | 'CONSONANTS'): NameNumberBreakdown {
  const letters = lettersFor(normalized, filter);
  const sum = letters.reduce((total, l) => total + l.value, 0);
  return { normalizedName: normalized.display, letters, sum };
}
