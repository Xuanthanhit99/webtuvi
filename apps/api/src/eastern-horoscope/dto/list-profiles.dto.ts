import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import type { EasternHoroscopeProfileStatus } from '@prisma/client';

export const EASTERN_HOROSCOPE_PROFILE_STATUSES: EasternHoroscopeProfileStatus[] = ['ACTIVE', 'ARCHIVED', 'DELETED'];

export class ListProfilesQueryDto {
  @ApiPropertyOptional({ enum: EASTERN_HOROSCOPE_PROFILE_STATUSES })
  @IsOptional()
  @IsIn(EASTERN_HOROSCOPE_PROFILE_STATUSES)
  status?: EasternHoroscopeProfileStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;
}
