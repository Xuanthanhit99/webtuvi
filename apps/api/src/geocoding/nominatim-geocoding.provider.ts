import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppConfiguration } from '../config/configuration';
import { GeocodingUnavailableError, type GeocodingCandidate, type GeocodingProvider } from './geocoding-provider.interface';

const MAX_RESULTS = 5;

interface NominatimResult {
  display_name?: string;
  lat?: string;
  lon?: string;
  address?: { country_code?: string };
}

/**
 * Phase 8 — server-side-only Nominatim (OpenStreetMap) geocoding. Never called from the browser
 * directly (`GeocodingController` is the sole caller path). Respects Nominatim's usage policy: an
 * identifying `User-Agent`, a bounded query, and no per-keystroke request pattern (that
 * discipline lives in the frontend and in `GeocodingService`'s explicit-search-only contract, not
 * here). See docs/architecture/natal-chart-discovery.md "Geocoding architecture".
 */
@Injectable()
export class NominatimGeocodingProvider implements GeocodingProvider {
  private readonly logger = new Logger('Geocoding');
  private readonly baseUrl: string;
  private readonly userAgent: string;
  private readonly timeoutMs: number;

  constructor(configService: ConfigService) {
    const config = configService.get<AppConfiguration>('app')!;
    this.baseUrl = config.geocoding.nominatimBaseUrl;
    this.userAgent = config.geocoding.userAgent;
    this.timeoutMs = config.geocoding.timeoutMs;
  }

  async search(query: string): Promise<GeocodingCandidate[]> {
    const trimmed = query.trim();
    if (trimmed.length === 0) return [];

    const url = new URL('/search', this.baseUrl);
    url.searchParams.set('q', trimmed);
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('addressdetails', '1');
    url.searchParams.set('limit', String(MAX_RESULTS));

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'GET',
        headers: { 'User-Agent': this.userAgent, Accept: 'application/json' },
        signal: controller.signal,
      });
    } catch (error) {
      const aborted = error instanceof Error && error.name === 'AbortError';
      this.logger.warn(`Nominatim request failed: ${aborted ? 'timeout' : error instanceof Error ? error.message : 'unknown error'}`);
      throw new GeocodingUnavailableError('Location search is temporarily unavailable.');
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      this.logger.warn(`Nominatim responded with status ${response.status}`);
      throw new GeocodingUnavailableError('Location search is temporarily unavailable.');
    }

    let results: NominatimResult[];
    try {
      results = (await response.json()) as NominatimResult[];
    } catch {
      throw new GeocodingUnavailableError('Location search is temporarily unavailable.');
    }

    return results
      .filter((result): result is Required<Pick<NominatimResult, 'display_name' | 'lat' | 'lon'>> & NominatimResult =>
        Boolean(result.display_name && result.lat && result.lon),
      )
      .map((result) => {
        const latitude = Number(result.lat);
        const longitude = Number(result.lon);
        return {
          label: result.display_name,
          latitude,
          longitude,
          countryCode: result.address?.country_code ? result.address.country_code.toUpperCase() : null,
        };
      })
      .filter((candidate) => Number.isFinite(candidate.latitude) && Number.isFinite(candidate.longitude));
  }
}
