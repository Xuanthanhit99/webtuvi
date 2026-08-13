import tzlookup from 'tz-lookup';
import moment from 'moment-timezone';
import { Origin } from 'circular-natal-horoscope-js';

/**
 * `tz-lookup`'s coarse polygon dataset resolves a real Hà Nội coordinate to `Asia/Bangkok`
 * instead of `Asia/Ho_Chi_Minh` (verified during this sprint's engine spike). Modern-era birth
 * dates are unaffected numerically — both zones have used UTC+7 with no DST since 1975 — but
 * historical Vietnamese offsets (Vietnam used UTC+8 for stretches between 1955 and 1975, unlike
 * Thailand's unbroken UTC+7) would silently produce a wrong chart for older Vietnamese birth
 * dates if left uncorrected, and the zone *label* would always look wrong to a Vietnamese user
 * regardless of date. This is a narrow, disclosed, tested correction for country codes verified
 * to have exactly one true IANA zone — not a general geocoding fix. Extend only after verifying a
 * specific, real misclassification the same way (see
 * docs/architecture/natal-chart-discovery.md).
 */
export const NATAL_CHART_TIMEZONE_COUNTRY_OVERRIDES: Record<string, string> = {
  VN: 'Asia/Ho_Chi_Minh',
};

export interface ResolveNatalOriginInput {
  /** Calendar year. */
  year: number;
  /** 1-12 (calendar convention — converted internally to the library's 0-indexed month). */
  month: number;
  day: number;
  hour: number;
  minute: number;
  latitude: number;
  longitude: number;
  /** ISO 3166-1 alpha-2, from the geocoding result's address details, if available. */
  countryCode?: string | null;
}

export interface ResolvedNatalOrigin {
  origin: InstanceType<typeof Origin>;
  /** The IANA identifier actually used for calculation/display — may differ from what
   * `tz-lookup(latitude, longitude)` alone would return, per the override table above. */
  timezone: string;
}

/**
 * Resolves the IANA timezone for a birth coordinate (with the narrow, documented country
 * override above applied) and builds a `circular-natal-horoscope-js` `Origin` whose derived UTC
 * instant / Julian Date / Local Sidereal Time are correct for that resolved zone — even though
 * `Origin`'s own constructor has no way to accept a timezone override directly.
 *
 * How the correction works when an override applies: the requested wall-clock birth time is
 * interpreted in the *correct* zone to get the true UTC instant, then that instant is
 * re-expressed as wall-clock fields in whichever zone `tz-lookup` would derive again from the
 * same coordinates. Feeding those compensated fields back into `Origin` makes it re-derive the
 * same (uncorrected) zone internally, but the resulting UTC/Julian Date/Local Sidereal Time — all
 * computed by the library's own tested math — come out numerically identical to using the correct
 * zone directly. `origin.timezone`/`localTime` are then overwritten to the true zone/local time
 * for accurate display; this is cosmetic only and never touches the already-correct calculation
 * fields.
 */
export function resolveNatalOrigin(input: ResolveNatalOriginInput): ResolvedNatalOrigin {
  const { year, month, day, hour, minute, latitude, longitude, countryCode } = input;
  const zeroIndexedMonth = month - 1;

  const libraryZone = tzlookup(latitude, longitude);
  const overrideZone = countryCode ? NATAL_CHART_TIMEZONE_COUNTRY_OVERRIDES[countryCode.toUpperCase()] : undefined;
  const resolvedZone = overrideZone ?? libraryZone;

  if (resolvedZone === libraryZone) {
    return {
      origin: new Origin({ year, month: zeroIndexedMonth, date: day, hour, minute, latitude, longitude }),
      timezone: libraryZone,
    };
  }

  const trueLocal = moment.tz({ year, month: zeroIndexedMonth, date: day, hour, minute, second: 0 }, resolvedZone);
  const compensatedLocal = trueLocal.clone().utc().tz(libraryZone);

  const origin = new Origin({
    year: compensatedLocal.year(),
    month: compensatedLocal.month(),
    date: compensatedLocal.date(),
    hour: compensatedLocal.hour(),
    minute: compensatedLocal.minute(),
    latitude,
    longitude,
  });

  const correctZoneMeta = moment.tz.zone(resolvedZone);
  if (!correctZoneMeta) {
    throw new Error(`Unknown IANA timezone override "${resolvedZone}" — check NATAL_CHART_TIMEZONE_COUNTRY_OVERRIDES.`);
  }

  origin.timezone = correctZoneMeta;
  origin.localTime = trueLocal;
  origin.localTimeFormatted = trueLocal.format();

  return { origin, timezone: resolvedZone };
}
