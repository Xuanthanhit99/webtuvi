import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';
import type { TarotReadingStatus } from '@prisma/client';
import { TAROT_READING_TYPES } from './draw-reading.dto';

export const TAROT_READING_STATUSES: TarotReadingStatus[] = ['ACTIVE', 'ARCHIVED', 'DELETED'];

export class ListReadingsQueryDto {
  @ApiPropertyOptional({ enum: TAROT_READING_STATUSES })
  @IsOptional()
  @IsIn(TAROT_READING_STATUSES)
  status?: TarotReadingStatus;

  @ApiPropertyOptional({ enum: TAROT_READING_TYPES })
  @IsOptional()
  @IsIn(TAROT_READING_TYPES)
  type?: string;

  /** Case-insensitive substring match against the reading's own real `question` — a real DB
   * query, never a fake/client-side filter. */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

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
