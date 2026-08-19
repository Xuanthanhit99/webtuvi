import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

/** Exact-match only — no partial/fuzzy search, no wildcard, no enumeration surface. Exactly one of
 * `email`/`id` must be provided; enforced in the service, not here, so the error carries a stable
 * application error code instead of a generic validation message. */
export class AdminUserLookupQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  id?: string;
}
