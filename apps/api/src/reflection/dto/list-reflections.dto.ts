import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import type { ReflectionCategory, ReflectionState, ReflectionTrigger } from '@prisma/client';

export const REFLECTION_CATEGORIES: ReflectionCategory[] = [
  'GOAL', 'TOPIC', 'JOURNAL', 'WELLBEING', 'ALIGNMENT', 'MISMATCH', 'INACTIVITY',
];

export const REFLECTION_TRIGGERS: ReflectionTrigger[] = [
  'REPEATED_TOPIC', 'REPEATED_GOAL', 'LONG_INACTIVITY', 'GOAL_REGRESSION', 'POSITIVE_STREAK',
  'NEGATIVE_STREAK', 'REPEATED_JOURNAL_THEME', 'MEMORY_JOURNAL_ALIGNMENT', 'GOAL_ACTIVITY_MISMATCH',
];

/** NEW is excluded — see ReflectionCandidate's schema comment: reserved, never assigned this
 * sprint, so it would never match anything if allowed as a filter value. */
export const REFLECTION_STATES: Exclude<ReflectionState, 'NEW'>[] = ['READY', 'DISMISSED', 'ARCHIVED', 'EXPIRED'];

export const REFLECTION_SORTS = ['score', 'recency', 'category'] as const;

export class ListReflectionsQueryDto {
  @ApiPropertyOptional({ enum: REFLECTION_CATEGORIES })
  @IsOptional()
  @IsIn(REFLECTION_CATEGORIES)
  category?: ReflectionCategory;

  @ApiPropertyOptional({ enum: REFLECTION_TRIGGERS })
  @IsOptional()
  @IsIn(REFLECTION_TRIGGERS)
  trigger?: ReflectionTrigger;

  @ApiPropertyOptional({ enum: REFLECTION_STATES })
  @IsOptional()
  @IsIn(REFLECTION_STATES)
  state?: Exclude<ReflectionState, 'NEW'>;

  @ApiPropertyOptional({ enum: REFLECTION_SORTS })
  @IsOptional()
  @IsIn(REFLECTION_SORTS)
  sort?: (typeof REFLECTION_SORTS)[number];

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
