import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsISO8601, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import type { ReviewState, ReviewWindow } from '@prisma/client';

export const REVIEW_WINDOWS: ReviewWindow[] = ['WEEK', 'MONTH', 'CUSTOM'];
export const REVIEW_STATES: ReviewState[] = ['NOT_READY', 'READY', 'ARCHIVED'];

/** Phase 6 — the list-level filters: window, status, and date (on `windowStart`). */
export class ListReviewsQueryDto {
  @ApiPropertyOptional({ enum: REVIEW_WINDOWS })
  @IsOptional()
  @IsIn(REVIEW_WINDOWS)
  window?: ReviewWindow;

  @ApiPropertyOptional({ enum: REVIEW_STATES })
  @IsOptional()
  @IsIn(REVIEW_STATES)
  state?: ReviewState;

  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601()
  to?: string;

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
