import { Controller, Get, Query, ServiceUnavailableException, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { GeocodingSearchQueryDto } from './dto/geocoding-search.dto';
import { GeocodingService, type GeocodingSearchResultDto } from './geocoding.service';
import { GeocodingUnavailableError } from './geocoding-provider.interface';

/**
 * Server-side-only geocoding search — the frontend never calls Nominatim directly (Phase 8/22).
 * Auth-gated like every other route in this app; a GET route is CSRF-exempt by the project-wide
 * `CsrfGuard`'s safe-method allowlist. Called only on an explicit user search action, never
 * per-keystroke (enforced in `birth-input-form.tsx`, not here).
 */
@ApiTags('geocoding')
@Controller('geocoding')
@UseGuards(JwtAuthGuard)
export class GeocodingController {
  constructor(private readonly geocoding: GeocodingService) {}

  @Get('search')
  @ApiOperation({ summary: 'Search for a place by name; returns opaque tokens, never raw coordinates' })
  async search(@Query() query: GeocodingSearchQueryDto): Promise<GeocodingSearchResultDto[]> {
    try {
      return await this.geocoding.search(query.q);
    } catch (error) {
      if (error instanceof GeocodingUnavailableError) {
        throw new ServiceUnavailableException({ code: 'GEOCODING_UNAVAILABLE', message: error.message });
      }
      throw error;
    }
  }
}
