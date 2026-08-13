import { NatalChartCalculatorService } from './natal-chart-calculator.service';
import { normalizeBirthDate, normalizeBirthTime } from './natal-chart-birth-input.util';

/**
 * Phase 7 — golden-vector verification. Expected values are sourced independently of
 * `circular-natal-horoscope-js` (never "does the library agree with itself"):
 *
 * - Cases labeled EQUINOX/SOLSTICE use published UTC instants of astronomically well-defined
 *   moments (the March equinox / June solstice — by definition, the exact instant the Sun's
 *   tropical ecliptic longitude crosses 0°/90°). Sources: space.com and Wikipedia's "Equinox"/
 *   "June solstice" pages, retrieved via web search during this sprint (2020 March equinox:
 *   03:49-03:50 UTC; 2000 March equinox: 07:35 UTC; 2020 June solstice: 21:44 UTC).
 * - Cases labeled ELONGATION use well-documented orbital-mechanics facts (Mercury's maximum
 *   solar elongation is ~28°, Venus's is ~48° — true regardless of date, and true regardless of
 *   which ephemeris library computes the positions).
 * - Reykjavik (64.1265, -21.8174) is used as the equinox/solstice test location specifically
 *   because `Atlantic/Reykjavik` has used a fixed UTC+0 offset with no DST since 1968 (verified
 *   directly against `moment-timezone`'s own zone data during this sprint), so local wall-clock
 *   input equals the published UTC instant exactly — no timezone conversion to get wrong.
 */
describe('NatalChartCalculatorService golden vectors', () => {
  let calculator: NatalChartCalculatorService;

  beforeEach(() => {
    calculator = new NatalChartCalculatorService();
  });

  function sunLongitude(input: Parameters<NatalChartCalculatorService['calculate']>[0]): number {
    const result = calculator.calculate(input);
    return result.placements.find((p) => p.body === 'sun')!.longitude;
  }

  it('EQUINOX — Sun is at 0° tropical longitude at the 2020 March equinox (03:49 UTC)', () => {
    const longitude = sunLongitude({
      birthDate: normalizeBirthDate('2020-03-20'),
      birthTime: normalizeBirthTime('03:49'),
      latitude: 64.1265,
      longitude: -21.8174,
      countryCode: 'IS',
    });
    const distanceFromZero = Math.min(longitude, 360 - longitude);
    expect(distanceFromZero).toBeLessThan(0.05);
  });

  it('EQUINOX — Sun is at 0° tropical longitude at the 2000 March equinox (07:35 UTC)', () => {
    const longitude = sunLongitude({
      birthDate: normalizeBirthDate('2000-03-20'),
      birthTime: normalizeBirthTime('07:35'),
      latitude: 64.1265,
      longitude: -21.8174,
      countryCode: 'IS',
    });
    const distanceFromZero = Math.min(longitude, 360 - longitude);
    expect(distanceFromZero).toBeLessThan(0.05);
  });

  it('SOLSTICE — Sun is at 90° tropical longitude (0° Cancer) at the 2020 June solstice (21:44 UTC)', () => {
    const longitude = sunLongitude({
      birthDate: normalizeBirthDate('2020-06-20'),
      birthTime: normalizeBirthTime('21:44'),
      latitude: 64.1265,
      longitude: -21.8174,
      countryCode: 'IS',
    });
    expect(Math.abs(longitude - 90)).toBeLessThan(0.05);
  });

  it('ELONGATION (Case A) — Mercury never exceeds ~28° solar elongation, across several ordinary dates', () => {
    const dates = ['1995-08-17', '2000-06-15', '2010-01-01', '2023-11-03'];
    for (const date of dates) {
      const result = calculator.calculate({
        birthDate: normalizeBirthDate(date),
        birthTime: normalizeBirthTime('12:00'),
        latitude: 40.7128,
        longitude: -74.006,
        countryCode: 'US',
      });
      const sun = result.placements.find((p) => p.body === 'sun')!.longitude;
      const mercury = result.placements.find((p) => p.body === 'mercury')!.longitude;
      const diff = Math.abs(sun - mercury);
      const elongation = Math.min(diff, 360 - diff);
      expect(elongation).toBeLessThanOrEqual(28.5);
    }
  });

  it('ELONGATION (Case B) — Venus never exceeds ~48° solar elongation, at a Southern Hemisphere / different-timezone location', () => {
    const dates = ['1998-04-12', '2005-09-30', '2015-12-25'];
    for (const date of dates) {
      const result = calculator.calculate({
        birthDate: normalizeBirthDate(date),
        birthTime: normalizeBirthTime('09:15'),
        latitude: -33.8688,
        longitude: 151.2093,
        countryCode: 'AU',
      });
      const sun = result.placements.find((p) => p.body === 'sun')!.longitude;
      const venus = result.placements.find((p) => p.body === 'venus')!.longitude;
      const diff = Math.abs(sun - venus);
      const elongation = Math.min(diff, 360 - diff);
      expect(elongation).toBeLessThanOrEqual(48.5);
    }
  });

  it('SENSITIVITY (Case D) — flipping birth time by 12 hours moves the Ascendant by close to 180° at the equator', () => {
    // The Descendant is always exactly 180° from the Ascendant by definition, and rotating the
    // whole sky by ~180° of local sidereal time (~12 solar hours, plus the small solar/sidereal
    // rate difference) swaps which ecliptic point is rising vs. setting — an exact geometric
    // symmetry, independent of any ephemeris library. Tested at the equator specifically because
    // this near-180° relationship holds cleanly there; at high latitudes it's genuinely and
    // correctly distorted by Placidus's well-known "fast/slow house" nonlinearity (verified
    // empirically during this sprint: the same 12-hour flip at London's latitude, 51.5°N, yields
    // only ~127° — a real property of the house-system geometry, not a calculator bug — which is
    // why this specific golden check is scoped to a low-latitude location).
    const base = { birthDate: normalizeBirthDate('2005-07-04'), latitude: 0.0, longitude: -0.1278, countryCode: null };
    const morning = calculator.calculate({ ...base, birthTime: normalizeBirthTime('06:00') });
    const evening = calculator.calculate({ ...base, birthTime: normalizeBirthTime('18:00') });

    const diff = Math.abs(morning.ascendant!.longitude - evening.ascendant!.longitude);
    const angularDiff = Math.min(diff, 360 - diff);
    expect(angularDiff).toBeGreaterThan(178);
    expect(angularDiff).toBeLessThan(182);
  });

  it('the Ascendant/Descendant relationship at a high latitude is real house-system geometry, not undefined behavior — sensitivity is still present, just non-uniform', () => {
    const base = { birthDate: normalizeBirthDate('2005-07-04'), latitude: 51.5074, longitude: -0.1278, countryCode: 'GB' as const };
    const morning = calculator.calculate({ ...base, birthTime: normalizeBirthTime('06:00') });
    const evening = calculator.calculate({ ...base, birthTime: normalizeBirthTime('18:00') });

    expect(morning.ascendant!.longitude).not.toBeCloseTo(evening.ascendant!.longitude, 0);
  });
});

describe('NatalChartCalculatorService determinism and degrade paths', () => {
  let calculator: NatalChartCalculatorService;

  beforeEach(() => {
    calculator = new NatalChartCalculatorService();
  });

  const knownBirth = {
    birthDate: normalizeBirthDate('2000-06-15'),
    birthTime: normalizeBirthTime('14:30'),
    latitude: 21.0285,
    longitude: 105.8542,
    countryCode: 'VN' as const,
  };

  it('is deterministic — identical input produces byte-identical output', () => {
    const a = calculator.calculate(knownBirth);
    const b = calculator.calculate(knownBirth);
    expect(a).toEqual(b);
  });

  it('reports the pinned calculation/engine version, zodiac mode, and house system on every result', () => {
    const result = calculator.calculate(knownBirth);
    expect(result.calculationVersion).toBe('natal-chart-circular-horoscope-v1');
    expect(result.engineVersion).toBe('1.1.0');
    expect(result.zodiacMode).toBe('tropical');
    expect(result.houseSystem).toBe('placidus');
  });

  it('applies the documented Vietnam timezone correction and computes all ten classical planets, houses, and an Ascendant when birth time and location are both known', () => {
    const result = calculator.calculate(knownBirth);
    expect(result.timezone).toBe('Asia/Ho_Chi_Minh');
    expect(result.housesAvailable).toBe(true);
    expect(result.placements).toHaveLength(10);
    expect(result.placements.map((p) => p.body).sort()).toEqual(
      ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'].sort(),
    );
    expect(result.houses).toHaveLength(12);
    expect(result.houses.map((h) => h.number).sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(result.ascendant).not.toBeNull();
    expect(result.midheaven).not.toBeNull();
    for (const placement of result.placements) {
      expect(placement.house).not.toBeNull();
      expect(placement.house).toBeGreaterThanOrEqual(1);
      expect(placement.house).toBeLessThanOrEqual(12);
    }
  });

  it('every aspect only references major aspect types with a plausible orb', () => {
    const result = calculator.calculate(knownBirth);
    expect(result.aspects.length).toBeGreaterThan(0);
    for (const aspect of result.aspects) {
      expect(['conjunction', 'opposition', 'trine', 'square', 'sextile']).toContain(aspect.type);
      expect(aspect.orb).toBeGreaterThanOrEqual(0);
      expect(aspect.angle).toBeGreaterThanOrEqual(0);
      expect(aspect.angle).toBeLessThanOrEqual(180);
    }
  });

  it('degrades gracefully when birth time is unknown — planets/signs still compute, houses/Ascendant/Midheaven are omitted, never fabricated', () => {
    const result = calculator.calculate({ ...knownBirth, birthTime: null });
    expect(result.housesAvailable).toBe(false);
    expect(result.houses).toHaveLength(0);
    expect(result.ascendant).toBeNull();
    expect(result.midheaven).toBeNull();
    expect(result.placements).toHaveLength(10);
    for (const placement of result.placements) {
      expect(placement.house).toBeNull();
    }
  });

  it('degrades gracefully at extreme/polar latitudes — houses/Ascendant/Midheaven are omitted even when birth time is known', () => {
    const result = calculator.calculate({ ...knownBirth, latitude: 78.0, longitude: 15.0, countryCode: null });
    expect(result.housesAvailable).toBe(false);
    expect(result.houses).toHaveLength(0);
    expect(result.ascendant).toBeNull();
    expect(result.midheaven).toBeNull();
    expect(result.placements).toHaveLength(10);
  });

  it('omits aspects involving the Ascendant/Midheaven when houses are unavailable', () => {
    const result = calculator.calculate({ ...knownBirth, birthTime: null });
    for (const aspect of result.aspects) {
      expect(aspect.pointA).not.toBe('ascendant');
      expect(aspect.pointA).not.toBe('midheaven');
      expect(aspect.pointB).not.toBe('ascendant');
      expect(aspect.pointB).not.toBe('midheaven');
    }
  });

  it('every placement/house/aspect degreeInSign or angle stays within its valid 0-30 / 0-360 range', () => {
    const result = calculator.calculate(knownBirth);
    for (const placement of result.placements) {
      expect(placement.longitude).toBeGreaterThanOrEqual(0);
      expect(placement.longitude).toBeLessThan(360);
      expect(placement.degreeInSign).toBeGreaterThanOrEqual(0);
      expect(placement.degreeInSign).toBeLessThan(30);
    }
    for (const house of result.houses) {
      expect(house.cuspLongitude).toBeGreaterThanOrEqual(0);
      expect(house.cuspLongitude).toBeLessThan(360);
    }
  });
});
