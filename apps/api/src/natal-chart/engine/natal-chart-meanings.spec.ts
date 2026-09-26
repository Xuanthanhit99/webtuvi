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
    expect(meaning).toContain('Sao Thủy');
    expect(meaning).toContain('Song Tử');
    expect(meaning).toContain('Nhà 3');
  });

  it('omits the house clause entirely when house is null — never fabricates a house', () => {
    const meaning = composePlacementMeaning('mercury', 'gemini', null);
    expect(meaning).toContain('Sao Thủy');
    expect(meaning).toContain('Song Tử');
    expect(meaning).not.toContain('Nhà');
  });

  it('composes an angle (Ascendant/Midheaven) meaning', () => {
    expect(composeAngleMeaning('ascendant', 'libra')).toContain('Cung Mọc');
    expect(composeAngleMeaning('ascendant', 'libra')).toContain('Thiên Bình');
    expect(composeAngleMeaning('midheaven', 'capricorn')).toContain('Thiên Đỉnh');
  });

  it('composes an aspect meaning between two named points', () => {
    const meaning = composeAspectMeaning('sun', 'moon', 'trine');
    expect(meaning).toContain('Mặt Trời');
    expect(meaning).toContain('Mặt Trăng');
    expect(meaning).toContain('Tam hợp');
  });

  it('composes an aspect meaning involving an angle point using its full label', () => {
    const meaning = composeAspectMeaning('venus', 'ascendant', 'conjunction');
    expect(meaning).toContain('Sao Kim');
    expect(meaning).toContain('Cung Mọc');
  });

  it('houseOrdinal formats standard and teen-exception cases correctly', () => {
    expect(houseOrdinal(1)).toBe('Nhà 1');
    expect(houseOrdinal(2)).toBe('Nhà 2');
    expect(houseOrdinal(3)).toBe('Nhà 3');
    expect(houseOrdinal(4)).toBe('Nhà 4');
    expect(houseOrdinal(11)).toBe('Nhà 11');
    expect(houseOrdinal(12)).toBe('Nhà 12');
    expect(houseOrdinal(13)).toBe('Nhà 13');
  });
});
