import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { INSIGHT_CATEGORIES } from '../../insight/dto/list-insight-candidates.dto';
import type { InsightPriorityTier } from '../../insight/presentation/insight-presentation.types';

export const REVIEW_PRIORITY_TIERS: InsightPriorityTier[] = ['LOW', 'MEDIUM', 'HIGH'];

/** Phase 6 — the detail-level (evidence) filters: category and priority tier. `category` reuses
 * the same 7-value list InsightCategory/ReflectionCategory already share (an evidence item's
 * `category` column always holds one of these, or the two real-precedent-derived values —
 * `GOAL`/`JOURNAL` — Review's own Memory/Journal evidence use, both already members of this list). */
export class ReviewDetailQueryDto {
  @ApiPropertyOptional({ enum: INSIGHT_CATEGORIES })
  @IsOptional()
  @IsIn(INSIGHT_CATEGORIES)
  category?: string;

  @ApiPropertyOptional({ enum: REVIEW_PRIORITY_TIERS })
  @IsOptional()
  @IsIn(REVIEW_PRIORITY_TIERS)
  priorityTier?: InsightPriorityTier;
}
