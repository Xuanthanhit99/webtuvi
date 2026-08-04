import {
  deepEqualJson,
  differingSharedKeys,
  jaccardSimilarity,
  matchingSharedKeys,
  normalizeText,
  significantTokens,
  similarityScore,
  tokenize,
} from './text-normalization.util';

describe('normalizeText', () => {
  it('makes "I like coffee." and "I like coffee" identical', () => {
    expect(normalizeText('I like coffee.')).toBe(normalizeText('I like coffee'));
    expect(normalizeText('I like coffee.')).toBe('i like coffee');
  });

  it('collapses repeated whitespace and trims', () => {
    expect(normalizeText('  I   like   coffee  ')).toBe('i like coffee');
  });

  it('strips common punctuation', () => {
    expect(normalizeText("Don't; go, there!")).toBe('dont go there');
  });
});

describe('tokenize', () => {
  it('splits normalized text into tokens', () => {
    expect(tokenize('I like coffee.')).toEqual(['i', 'like', 'coffee']);
  });

  it('returns an empty array for empty input', () => {
    expect(tokenize('   ')).toEqual([]);
  });
});

describe('significantTokens', () => {
  it('drops stopwords and single-letter tokens', () => {
    expect(significantTokens('I live in Tokyo')).toEqual(['live', 'tokyo']);
  });
});

describe('jaccardSimilarity', () => {
  it('is 1 for identical token sets', () => {
    expect(jaccardSimilarity(['a', 'b'], ['a', 'b'])).toBe(1);
  });

  it('is 0 for disjoint sets', () => {
    expect(jaccardSimilarity(['a'], ['b'])).toBe(0);
  });

  it('is 0 for two empty sets (no division by zero)', () => {
    expect(jaccardSimilarity([], [])).toBe(0);
  });

  it('computes partial overlap correctly', () => {
    // intersection={b,c} size 2, union={a,b,c,d} size 4 -> 0.5
    expect(jaccardSimilarity(['a', 'b', 'c'], ['b', 'c', 'd'])).toBe(0.5);
  });
});

describe('similarityScore', () => {
  it('scores exact-after-normalization text as 100', () => {
    expect(similarityScore('I like coffee.', 'I like coffee')).toBe(100);
  });

  it('scores unrelated text as 0', () => {
    expect(similarityScore('I like coffee', 'The weather is nice')).toBe(0);
  });
});

describe('deepEqualJson', () => {
  it('treats key order as irrelevant', () => {
    expect(deepEqualJson({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true);
  });

  it('detects differing nested values', () => {
    expect(deepEqualJson({ city: 'Tokyo' }, { city: 'Osaka' })).toBe(false);
  });

  it('handles arrays element-wise', () => {
    expect(deepEqualJson([1, 2, 3], [1, 2, 3])).toBe(true);
    expect(deepEqualJson([1, 2, 3], [1, 2, 4])).toBe(false);
  });

  it('handles null correctly', () => {
    expect(deepEqualJson(null, null)).toBe(true);
    expect(deepEqualJson(null, {})).toBe(false);
  });
});

describe('differingSharedKeys / matchingSharedKeys', () => {
  const a = { city: 'Tokyo', country: 'Japan' };
  const b = { city: 'Osaka', country: 'Japan' };

  it('finds the shared key whose value differs', () => {
    expect(differingSharedKeys(a, b)).toEqual(['city']);
  });

  it('finds the shared key whose value matches', () => {
    expect(matchingSharedKeys(a, b)).toEqual(['country']);
  });

  it('returns an empty array when either side is missing', () => {
    expect(differingSharedKeys(null, b)).toEqual([]);
    expect(matchingSharedKeys(a, undefined)).toEqual([]);
  });
});
