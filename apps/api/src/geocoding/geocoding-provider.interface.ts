/** A single geocoded place candidate — never carries a client-facing token; that's assigned by
 * `GeocodingService`, one layer above the provider. */
export interface GeocodingCandidate {
  /** Exactly the provider's own display name — never rewritten. */
  label: string;
  latitude: number;
  longitude: number;
  /** ISO 3166-1 alpha-2, uppercase, when the provider supplies it — feeds
   * `NATAL_CHART_TIMEZONE_COUNTRY_OVERRIDES`. */
  countryCode: string | null;
}

/** Swappable geocoding backend (Sprint 9: `NominatimGeocodingProvider` is the only
 * implementation — see docs/architecture/natal-chart-discovery.md's "Geocoding architecture"
 * section for why, and for the documented MVP-vs-production-scale tradeoff). */
export interface GeocodingProvider {
  /** Returns an empty array on "no matches," never on failure — failures throw
   * `GeocodingUnavailableError` so callers can distinguish "nothing found" from "couldn't ask." */
  search(query: string): Promise<GeocodingCandidate[]>;
}

export const GEOCODING_PROVIDER = Symbol('GEOCODING_PROVIDER');

/** Thrown on any failure to reach/parse the geocoding backend — callers must surface a truthful
 * "search unavailable, try again" state, never fabricate a result. */
export class GeocodingUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GeocodingUnavailableError';
  }
}
