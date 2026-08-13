import { IsOptional, IsUUID, Matches } from 'class-validator';

/** Format/length checks only — real calendar-date/time and location-token resolution happen
 * inside the record service (mirrors Numerology's own DTO-does-shape,
 * service-does-domain-rules split). `locationToken` is the opaque token from
 * `GET /geocoding/search`, never raw coordinates — the server always re-resolves the actual
 * latitude/longitude/place label itself (Phase 3/8/22: never trust client-supplied coordinates). */
export class CreateNatalChartDto {
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Birth date must be in YYYY-MM-DD format.' })
  birthDate!: string;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'Birth time must be in 24-hour HH:mm format.' })
  birthTime?: string;

  @IsUUID('4', { message: 'locationToken must be a valid location search result token.' })
  locationToken!: string;
}
