import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsISO8601, IsOptional } from 'class-validator';
import type { InsightCategory } from '@prisma/client';
import { INSIGHT_CATEGORIES } from './list-insight-candidates.dto';
import type { InsightTimelineGroupBy, InsightTimelineRange } from '../presentation/insight-presentation.types';

export const INSIGHT_TIMELINE_RANGES: InsightTimelineRange[] = ['today', 'week', 'month', 'custom'];
export const INSIGHT_TIMELINE_GROUP_BYS: InsightTimelineGroupBy[] = ['category', 'priority', 'topic'];

/** Phase 4 — Today / 7 days / 30 days / Custom range, grouped by category / priority / topic. */
export class InsightTimelineQueryDto {
  @ApiPropertyOptional({ enum: INSIGHT_TIMELINE_RANGES, description: 'Defaults to week' })
  @IsOptional()
  @IsIn(INSIGHT_TIMELINE_RANGES)
  range?: InsightTimelineRange;

  @ApiPropertyOptional({ description: 'Required when range=custom' })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({ description: 'Required when range=custom' })
  @IsOptional()
  @IsISO8601()
  to?: string;

  @ApiPropertyOptional({ enum: INSIGHT_TIMELINE_GROUP_BYS, description: 'Defaults to category' })
  @IsOptional()
  @IsIn(INSIGHT_TIMELINE_GROUP_BYS)
  groupBy?: InsightTimelineGroupBy;

  @ApiPropertyOptional({ enum: INSIGHT_CATEGORIES })
  @IsOptional()
  @IsIn(INSIGHT_CATEGORIES)
  category?: InsightCategory;
}
