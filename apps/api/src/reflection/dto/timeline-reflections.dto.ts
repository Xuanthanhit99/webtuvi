import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsISO8601, IsOptional } from 'class-validator';
import type { ReflectionCategory } from '@prisma/client';
import { REFLECTION_CATEGORIES, REFLECTION_SORTS } from './list-reflections.dto';

export class TimelineReflectionsQueryDto {
  @ApiPropertyOptional({ description: 'Start of a custom range — omit for the default Today/This week/Last week/Last month grouping.' })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({ description: 'End of a custom range.' })
  @IsOptional()
  @IsISO8601()
  to?: string;

  @ApiPropertyOptional({ enum: REFLECTION_CATEGORIES })
  @IsOptional()
  @IsIn(REFLECTION_CATEGORIES)
  category?: ReflectionCategory;

  @ApiPropertyOptional({ enum: REFLECTION_SORTS })
  @IsOptional()
  @IsIn(REFLECTION_SORTS)
  sort?: (typeof REFLECTION_SORTS)[number];
}
