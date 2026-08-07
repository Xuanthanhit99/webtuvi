import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsISO8601, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import type { GoalCategory, GoalDifficulty, GoalType, GoalVisibility } from '@prisma/client';

export const GOAL_CATEGORIES: GoalCategory[] = ['LEARNING', 'CAREER', 'HEALTH', 'HABIT', 'RELATIONSHIP', 'FINANCIAL', 'CREATIVE', 'PERSONAL', 'OTHER'];
export const GOAL_TYPES: GoalType[] = ['MILESTONE_BASED', 'METRIC_BASED', 'BINARY'];
export const GOAL_DIFFICULTIES: GoalDifficulty[] = ['EASY', 'MEDIUM', 'HARD'];
export const GOAL_VISIBILITIES: GoalVisibility[] = ['PRIVATE', 'COMPANION_VISIBLE'];

/** `linkedTag` is required — it is the one real, deterministic key `GoalProgressEngine` matches
 * Journal/Memory/Reflection/Insight/Review evidence against (see goal-system.md "Evidence
 * linking"). `targetValue`/`targetUnit` only matter for `type: METRIC_BASED` but are accepted
 * regardless — validated by the service layer against the chosen type, not this DTO, mirroring
 * `CustomReviewQueryDto`'s own "structural validation belongs to the domain, not the transport"
 * precedent. */
export class CreateGoalDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsIn(GOAL_CATEGORIES)
  category!: GoalCategory;

  @IsIn(GOAL_TYPES)
  type!: GoalType;

  @ApiPropertyOptional({ enum: GOAL_DIFFICULTIES })
  @IsOptional()
  @IsIn(GOAL_DIFFICULTIES)
  difficulty?: GoalDifficulty;

  /** Defaults to PRIVATE (never referenced by Companion) — an explicit, reversible opt-in to
   * COMPANION_VISIBLE, mirroring Memory's own PRIVATE/COMPANION_ALLOWED precedent. */
  @ApiPropertyOptional({ enum: GOAL_VISIBILITIES })
  @IsOptional()
  @IsIn(GOAL_VISIBILITIES)
  visibility?: GoalVisibility;

  @IsString()
  @MinLength(1)
  @MaxLength(60)
  linkedTag!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1_000_000)
  targetValue?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  targetUnit?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601()
  targetDate?: string;
}
