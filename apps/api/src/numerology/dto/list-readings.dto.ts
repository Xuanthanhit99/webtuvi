import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import type { NumerologyReadingStatus } from '@prisma/client';

export const NUMEROLOGY_READING_STATUSES: NumerologyReadingStatus[] = ['ACTIVE', 'ARCHIVED', 'DELETED'];

export class ListReadingsQueryDto {
  @ApiPropertyOptional({ enum: NUMEROLOGY_READING_STATUSES })
  @IsOptional()
  @IsIn(NUMEROLOGY_READING_STATUSES)
  status?: NumerologyReadingStatus;

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
