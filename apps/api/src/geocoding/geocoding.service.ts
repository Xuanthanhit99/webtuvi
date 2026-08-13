import { randomUUID } from 'crypto';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';
import type { AppConfiguration } from '../config/configuration';
import { GEOCODING_PROVIDER, type GeocodingCandidate, type GeocodingProvider } from './geocoding-provider.interface';

const REDIS_KEY_PREFIX = 'beaconvie:geocoding:candidate:';
const MAX_QUERY_LENGTH = 200;

export interface GeocodingSearchResultDto {
  /** Opaque, short-lived — the only thing a client ever echoes back to resolve coordinates.
   * Never the coordinates themselves (Phase 3/8/22: never trust client-supplied coordinates). */
  token: string;
  label: string;
}

/**
 * Phase 8 — the one place in the backend that turns a free-text place name into a
 * server-cached, token-addressable location candidate. `search()` is the only entry point that
 * calls out to Nominatim; `resolve()` only ever reads from Redis — a missing/expired token
 * fails truthfully rather than falling back to a fresh (and therefore client-request-timed,
 * re-costing) search.
 */
@Injectable()
export class GeocodingService {
  private readonly ttlSeconds: number;

  constructor(
    @Inject(GEOCODING_PROVIDER) private readonly provider: GeocodingProvider,
    private readonly redis: RedisService,
    configService: ConfigService,
  ) {
    this.ttlSeconds = configService.get<AppConfiguration>('app')!.geocoding.candidateTtlSeconds;
  }

  async search(query: string): Promise<GeocodingSearchResultDto[]> {
    const bounded = query.trim().slice(0, MAX_QUERY_LENGTH);
    if (bounded.length === 0) return [];

    const candidates = await this.provider.search(bounded);

    return Promise.all(
      candidates.map(async (candidate) => {
        const token = randomUUID();
        await this.redis.client.set(REDIS_KEY_PREFIX + token, JSON.stringify(candidate), 'EX', this.ttlSeconds);
        return { token, label: candidate.label };
      }),
    );
  }

  /** Returns `null` for a missing/expired/unknown token — callers must surface a truthful "search
   * again" state, never fabricate coordinates from a stale reference. */
  async resolve(token: string): Promise<GeocodingCandidate | null> {
    const raw = await this.redis.client.get(REDIS_KEY_PREFIX + token);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as GeocodingCandidate;
    } catch {
      return null;
    }
  }
}
