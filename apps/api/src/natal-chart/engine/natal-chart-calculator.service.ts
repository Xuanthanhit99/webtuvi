import { Injectable } from '@nestjs/common';
import { Horoscope } from 'circular-natal-horoscope-js';
import {
  NATAL_CHART_ASPECT_POINTS,
  NATAL_CHART_ASPECT_TYPES,
  NATAL_CHART_CALCULATION_VERSION,
  NATAL_CHART_ENGINE_VERSION,
  NATAL_CHART_HOUSE_SYSTEM,
  NATAL_CHART_HOUSE_UNAVAILABLE_LATITUDE_THRESHOLD,
  NATAL_CHART_PLANETS,
  NATAL_CHART_ZODIAC_MODE,
  type NatalChartPlanetKey,
} from './natal-chart-constants';
import { resolveNatalOrigin } from './natal-chart-timezone.util';
import type { NormalizedBirthDate, NormalizedBirthTime } from './natal-chart-birth-input.util';

/** When birth time is unknown, planet positions are still computed at a fixed, documented
 * wall-clock time (noon local) — the same convention major astrology software (e.g. astro.com)
 * uses for "time unknown" charts. Sign-level accuracy is essentially unaffected for every body
 * except a same-day Moon sign change (the Moon can move ~6-7° across half a day, occasionally
 * enough to cross a sign boundary) — disclosed here and in the architecture doc, never silently
 * hidden. Houses/Ascendant/Midheaven are never computed from this placeholder time; they're
 * omitted entirely (`housesAvailable: false`) whenever birth time isn't known. */
const UNKNOWN_BIRTH_TIME_HOUR = 12;
const UNKNOWN_BIRTH_TIME_MINUTE = 0;

const ZODIAC_SIGN_KEYS = [
  'aries',
  'taurus',
  'gemini',
  'cancer',
  'leo',
  'virgo',
  'libra',
  'scorpio',
  'sagittarius',
  'capricorn',
  'aquarius',
  'pisces',
] as const;
export type NatalZodiacSignKey = (typeof ZODIAC_SIGN_KEYS)[number];

const ASPECT_TYPE_KEYS = ['conjunction', 'opposition', 'trine', 'square', 'sextile'] as const;
export type NatalAspectTypeKey = (typeof ASPECT_TYPE_KEYS)[number];

export type NatalAspectPointKey = NatalChartPlanetKey | 'ascendant' | 'midheaven';

export interface CalculateNatalChartInput {
  birthDate: NormalizedBirthDate;
  /** `null` means birth time is unknown — planets/signs are still calculated (at
   * `UNKNOWN_BIRTH_TIME_HOUR`/`_MINUTE`), houses/Ascendant/Midheaven are omitted. */
  birthTime: NormalizedBirthTime | null;
  latitude: number;
  longitude: number;
  /** ISO 3166-1 alpha-2, from the geocoding result, when available — feeds the narrow timezone
   * correction table in `natal-chart-timezone.util.ts`. */
  countryCode?: string | null;
}

export interface NatalPlacementResult {
  body: NatalChartPlanetKey;
  /** Absolute ecliptic longitude, 0-360°. */
  longitude: number;
  sign: NatalZodiacSignKey;
  degreeInSign: number;
  house: number | null;
  retrograde: boolean;
}

export interface NatalHouseResult {
  number: number;
  cuspLongitude: number;
  sign: NatalZodiacSignKey;
}

export interface NatalAspectResult {
  pointA: NatalAspectPointKey;
  pointB: NatalAspectPointKey;
  type: NatalAspectTypeKey;
  orb: number;
  angle: number;
}

export interface NatalAngleResult {
  longitude: number;
  sign: NatalZodiacSignKey;
  degreeInSign: number;
}

export interface NatalChartCalculationResult {
  calculationVersion: string;
  engineVersion: string;
  zodiacMode: string;
  houseSystem: string;
  /** The IANA identifier actually used (post timezone-correction, see
   * `natal-chart-timezone.util.ts`). */
  timezone: string;
  housesAvailable: boolean;
  placements: NatalPlacementResult[];
  houses: NatalHouseResult[];
  aspects: NatalAspectResult[];
  ascendant: NatalAngleResult | null;
  midheaven: NatalAngleResult | null;
}

interface RawEclipticPosition {
  ChartPosition: { Ecliptic: { DecimalDegrees: number } };
  Sign: { key: string };
}

function degreeInSign(longitude: number): number {
  const normalized = ((longitude % 360) + 360) % 360;
  return normalized % 30;
}

function toSignKey(rawKey: string): NatalZodiacSignKey {
  const key = rawKey.toLowerCase();
  if (!(ZODIAC_SIGN_KEYS as readonly string[]).includes(key)) {
    throw new Error(`Unrecognized zodiac sign key from calculation engine: "${rawKey}".`);
  }
  return key as NatalZodiacSignKey;
}

function toAngleResult(raw: RawEclipticPosition): NatalAngleResult {
  const longitude = raw.ChartPosition.Ecliptic.DecimalDegrees;
  return { longitude, sign: toSignKey(raw.Sign.key), degreeInSign: degreeInSign(longitude) };
}

/**
 * Phase 6 — the deterministic Natal Chart Calculator. Pure function of normalized birth
 * date/time/location: no DB access, no I/O, no AI call, no randomness. Wraps
 * `circular-natal-horoscope-js`'s `Origin`/`Horoscope` classes; every displayed placement,
 * house, and aspect originates here — nothing else (including the AI interpretation layer) is
 * ever allowed to invent, adjust, or recalculate a chart fact.
 */
@Injectable()
export class NatalChartCalculatorService {
  calculate(input: CalculateNatalChartInput): NatalChartCalculationResult {
    const { birthDate, birthTime, latitude, longitude, countryCode } = input;
    const housesAvailable = birthTime !== null && Math.abs(latitude) < NATAL_CHART_HOUSE_UNAVAILABLE_LATITUDE_THRESHOLD;

    const { origin, timezone } = resolveNatalOrigin({
      year: birthDate.year,
      month: birthDate.month,
      day: birthDate.day,
      hour: birthTime?.hour ?? UNKNOWN_BIRTH_TIME_HOUR,
      minute: birthTime?.minute ?? UNKNOWN_BIRTH_TIME_MINUTE,
      latitude,
      longitude,
      countryCode,
    });

    const horoscope = new Horoscope({
      origin,
      houseSystem: NATAL_CHART_HOUSE_SYSTEM,
      zodiac: NATAL_CHART_ZODIAC_MODE,
      aspectPoints: [...NATAL_CHART_ASPECT_POINTS],
      aspectWithPoints: [...NATAL_CHART_ASPECT_POINTS],
      aspectTypes: [...NATAL_CHART_ASPECT_TYPES],
      language: 'en',
    });

    const placements: NatalPlacementResult[] = NATAL_CHART_PLANETS.map((body) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- library typings are `any`.
      const raw = (horoscope.CelestialBodies as any)[body];
      const longitudeDeg: number = raw.ChartPosition.Ecliptic.DecimalDegrees;
      return {
        body,
        longitude: longitudeDeg,
        sign: toSignKey(raw.Sign.key),
        degreeInSign: degreeInSign(longitudeDeg),
        house: housesAvailable ? (raw.House.id as number) : null,
        retrograde: Boolean(raw.isRetrograde),
      };
    });

    const houses: NatalHouseResult[] = housesAvailable
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (horoscope.Houses as any[]).map((house) => ({
          number: house.id as number,
          cuspLongitude: house.ChartPosition.StartPosition.Ecliptic.DecimalDegrees as number,
          sign: toSignKey(house.Sign.key as string),
        }))
      : [];

    // Longitude lookup for every point aspects can reference — the library's Aspect objects
    // expose `orb` (deviation from the aspect's exact nominal angle, e.g. "2.3° from an exact
    // Trine") but not the raw angular separation itself, so it's computed independently here
    // from the two points' own already-calculated longitudes, the same source of truth
    // everything else in this result comes from.
    const longitudeByPoint = new Map<NatalAspectPointKey, number>(placements.map((p) => [p.body, p.longitude]));
    if (housesAvailable) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      longitudeByPoint.set('ascendant', (horoscope.Ascendant as any).ChartPosition.Ecliptic.DecimalDegrees);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      longitudeByPoint.set('midheaven', (horoscope.Midheaven as any).ChartPosition.Ecliptic.DecimalDegrees);
    }

    function angularSeparation(a: NatalAspectPointKey, b: NatalAspectPointKey): number {
      const lonA = longitudeByPoint.get(a);
      const lonB = longitudeByPoint.get(b);
      if (lonA === undefined || lonB === undefined) {
        throw new Error(`Missing longitude for aspect point "${lonA === undefined ? a : b}".`);
      }
      const diff = Math.abs(lonA - lonB) % 360;
      return diff > 180 ? 360 - diff : diff;
    }

    const aspects: NatalAspectResult[] = (horoscope.Aspects.all as unknown[])
      .map((raw) => raw as { point1Key: string; point2Key: string; aspectKey: string; orb: number })
      .filter((raw) => (ASPECT_TYPE_KEYS as readonly string[]).includes(raw.aspectKey))
      .filter((raw) => housesAvailable || (raw.point1Key !== 'ascendant' && raw.point1Key !== 'midheaven' && raw.point2Key !== 'ascendant' && raw.point2Key !== 'midheaven'))
      .map((raw) => {
        const pointA = raw.point1Key as NatalAspectPointKey;
        const pointB = raw.point2Key as NatalAspectPointKey;
        return {
          pointA,
          pointB,
          type: raw.aspectKey as NatalAspectTypeKey,
          orb: raw.orb,
          angle: angularSeparation(pointA, pointB),
        };
      });

    return {
      calculationVersion: NATAL_CHART_CALCULATION_VERSION,
      engineVersion: NATAL_CHART_ENGINE_VERSION,
      zodiacMode: NATAL_CHART_ZODIAC_MODE,
      houseSystem: NATAL_CHART_HOUSE_SYSTEM,
      timezone,
      housesAvailable,
      placements,
      houses,
      aspects,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ascendant: housesAvailable ? toAngleResult(horoscope.Ascendant as any) : null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      midheaven: housesAvailable ? toAngleResult(horoscope.Midheaven as any) : null,
    };
  }
}
