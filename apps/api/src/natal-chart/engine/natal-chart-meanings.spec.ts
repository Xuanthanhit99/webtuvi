import { composeAngleMeaning, composeAspectMeaning, composePlacementMeaning, houseOrdinal, houseMeaning, planetMeaning, signMeaning } from './natal-chart-meanings';

describe('natal-chart-meanings', () => {
  it('every classical planet has a fixed meaning entry', () => {
    for (const body of ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'] as const) {
      const entry = planetMeaning(body);
      expect(entry.title.length).toBeGreaterThan(0);
      expect(entry.meaning.length).toBeGreaterThan(0);
    }
  });

  it('every zodiac sign has a fixed meaning entry', () => {
    for (const sign of ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'] as const) {
      const entry = signMeaning(sign);
      expect(entry.title.length).toBeGreaterThan(0);
      expect(entry.meaning.length).toBeGreaterThan(0);
    }
  });

  it('every house 1-12 has a fixed meaning entry', () => {
    for (let n = 1; n <= 12; n++) {
      const entry = houseMeaning(n);
      expect(entry.title).toContain(String(n));
    }
  });

  it('throws for an out-of-range house number rather than silently returning nothing', () => {
    expect(() => houseMeaning(0)).toThrow();
    expect(() => houseMeaning(13)).toThrow();
  });

  it('composes a placement meaning from planet + sign + house', () => {
    const meaning = composePlacementMeaning('mercury', 'gemini', 3);
    expect(meaning).toContain('Mercury');
    expect(meaning).toContain('Gemini');
    expect(meaning).toContain('3rd house');
  });

  it('omits the house clause entirely when house is null — never fabricates a house', () => {
    const meaning = composePlacementMeaning('mercury', 'gemini', null);
    expect(meaning).toContain('Mercury');
    expect(meaning).toContain('Gemini');
    expect(meaning).not.toContain('house');
  });

  it('composes an angle (Ascendant/Midheaven) meaning', () => {
    expect(composeAngleMeaning('ascendant', 'libra')).toContain('Ascendant');
    expect(composeAngleMeaning('ascendant', 'libra')).toContain('Libra');
    expect(composeAngleMeaning('midheaven', 'capricorn')).toContain('Midheaven');
  });

  it('composes an aspect meaning between two named points', () => {
    const meaning = composeAspectMeaning('sun', 'moon', 'trine');
    expect(meaning).toContain('Sun');
    expect(meaning).toContain('Moon');
    expect(meaning).toContain('Trine');
  });

  it('composes an aspect meaning involving an angle point using its full label', () => {
    const meaning = composeAspectMeaning('venus', 'ascendant', 'conjunction');
    expect(meaning).toContain('Venus');
    expect(meaning).toContain('Ascendant');
  });

  it('houseOrdinal formats standard and teen-exception cases correctly', () => {
    expect(houseOrdinal(1)).toBe('1st');
    expect(houseOrdinal(2)).toBe('2nd');
    expect(houseOrdinal(3)).toBe('3rd');
    expect(houseOrdinal(4)).toBe('4th');
    expect(houseOrdinal(11)).toBe('11th');
    expect(houseOrdinal(12)).toBe('12th');
    expect(houseOrdinal(13)).toBe('13th');
  });
});
