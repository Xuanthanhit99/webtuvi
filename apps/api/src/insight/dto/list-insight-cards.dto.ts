import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsInt, IsISO8601, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import type { InsightCategory, InsightStatus, ReflectionSourceType } from '@prisma/client';
import { INSIGHT_CATEGORIES, INSIGHT_STATUSES } from './list-insight-candidates.dto';
import type { InsightPriorityTier } from '../presentation/insight-presentation.types';

export const INSIGHT_PRIORITY_TIERS: InsightPriorityTier[] = ['LOW', 'MEDIUM', 'HIGH'];
export const INSIGHT_SOURCE_TYPES: ReflectionSourceType[] = ['JOURNAL', 'MEMORY', 'ACTIVITY', 'COMPANION'];
export const INSIGHT_CARD_SORTS = ['priority', 'recent'] as const;

/** Phase 6 filters: priority (tier), category, date (from/to on createdAt), status, source (which
 * evidence-reflection source type backs the insight) — no semantic filtering anywhere. */
export class ListInsightCardsQueryDto {
  @ApiPropertyOptional({ enum: INSIGHT_CATEGORIES })
  @IsOptional()
  @IsIn(INSIGHT_CATEGORIES)
  category?: InsightCategory;

  @ApiPropertyOptional({ enum: INSIGHT_STATUSES })
  @IsOptional()
  @IsIn(INSIGHT_STATUSES)
  status?: InsightStatus;

  @ApiPropertyOptional({ enum: INSIGHT_PRIORITY_TIERS })
  @IsOptional()
  @IsIn(INSIGHT_PRIORITY_TIERS)
  priorityTier?: InsightPriorityTier;

  @ApiPropertyOptional({ enum: INSIGHT_SOURCE_TYPES, description: 'Only insights with >= 1 evidence reflection citing this source type' })
  @IsOptional()
  @IsIn(INSIGHT_SOURCE_TYPES)
  source?: ReflectionSourceType;

  @ApiPropertyOptional({ description: 'Only pinned insights' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  pinned?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601()
  to?: string;

  @ApiPropertyOptional({ enum: INSIGHT_CARD_SORTS, description: 'priority (default) or recent (createdAt desc)' })
  @IsOptional()
  @IsIn(INSIGHT_CARD_SORTS)
  sort?: (typeof INSIGHT_CARD_SORTS)[number];

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
