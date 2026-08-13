import { fromPrismaAspectType, fromPrismaPlanet, fromPrismaPoint, fromPrismaSign, toPrismaAspectType, toPrismaPoint, toPrismaSign } from './natal-chart-enum.util';
import { NATAL_CHART_ASPECT_POINTS, NATAL_CHART_PLANETS } from './engine/natal-chart-constants';

const ZODIAC_SIGNS = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'] as const;
const ASPECT_TYPES = ['conjunction', 'opposition', 'trine', 'square', 'sextile'] as const;

describe('natal-chart-enum.util — round-trips for every value in each domain', () => {
  it('every aspect-point key (planets + Ascendant/Midheaven) round-trips through the Prisma enum', () => {
    for (const key of NATAL_CHART_ASPECT_POINTS) {
      expect(fromPrismaPoint(toPrismaPoint(key))).toBe(key);
    }
  });

  it('every planet key round-trips through the Prisma enum via the planet-narrowed helper', () => {
    for (const key of NATAL_CHART_PLANETS) {
      expect(fromPrismaPlanet(toPrismaPoint(key))).toBe(key);
    }
  });

  it('every zodiac sign key round-trips through the Prisma enum', () => {
    for (const key of ZODIAC_SIGNS) {
      expect(fromPrismaSign(toPrismaSign(key))).toBe(key);
    }
  });

  it('every aspect type key round-trips through the Prisma enum', () => {
    for (const key of ASPECT_TYPES) {
      expect(fromPrismaAspectType(toPrismaAspectType(key))).toBe(key);
    }
  });

  it('produces exactly the expected uppercase Prisma enum values (not just round-trip-safe, but the specific documented mapping)', () => {
    expect(toPrismaPoint('sun')).toBe('SUN');
    expect(toPrismaPoint('ascendant')).toBe('ASCENDANT');
    expect(toPrismaPoint('midheaven')).toBe('MIDHEAVEN');
    expect(toPrismaSign('sagittarius')).toBe('SAGITTARIUS');
    expect(toPrismaAspectType('conjunction')).toBe('CONJUNCTION');
  });
});
