import { Module } from '@nestjs/common';
import { GeocodingController } from './geocoding.controller';
import { GeocodingService } from './geocoding.service';
import { NominatimGeocodingProvider } from './nominatim-geocoding.provider';
import { GEOCODING_PROVIDER } from './geocoding-provider.interface';

/**
 * Sprint 9 — server-side-only geocoding behind a swappable `GeocodingProvider` interface. Only
 * `NatalChartModule` consumes this today; kept as its own module (not folded into
 * `natal-chart`) since it's a generic place-lookup capability, not natal-chart-specific logic.
 * `RedisModule` is `@Global()`, so `RedisService` is available without an explicit import here.
 */
@Module({
  controllers: [GeocodingController],
  providers: [GeocodingService, { provide: GEOCODING_PROVIDER, useClass: NominatimGeocodingProvider }],
  exports: [GeocodingService],
})
export class GeocodingModule {}
