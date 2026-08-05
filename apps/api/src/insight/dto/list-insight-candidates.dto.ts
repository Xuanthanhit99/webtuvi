import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import type { InsightCategory, InsightStatus } from '@prisma/client';

export const INSIGHT_CATEGORIES: InsightCategory[] = ['GOAL', 'TOPIC', 'JOURNAL', 'WELLBEING', 'ALIGNMENT', 'MISMATCH', 'INACTIVITY'];
export const INSIGHT_STATUSES: InsightStatus[] = ['NOT_READY', 'READY', 'INSUFFICIENT_EVIDENCE', 'ARCHIVED'];

export class ListInsightCandidatesQueryDto {
  @ApiPropertyOptional({ enum: INSIGHT_CATEGORIES })
  @IsOptional()
  @IsIn(INSIGHT_CATEGORIES)
  category?: InsightCategory;

  @ApiPropertyOptional({ enum: INSIGHT_STATUSES })
  @IsOptional()
  @IsIn(INSIGHT_STATUSES)
  status?: InsightStatus;

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
