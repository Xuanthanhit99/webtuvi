import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsISO8601, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import type { GoalCategory, GoalDifficulty, GoalVisibility } from '@prisma/client';
import { GOAL_CATEGORIES, GOAL_DIFFICULTIES, GOAL_VISIBILITIES } from './create-goal.dto';

/** Deliberately excludes `type` and `linkedTag` — changing a goal's completion formula or its
 * evidence-matching key mid-flight would silently invalidate every `GoalProgress`/`GoalEvidence`
 * row computed so far. Mirrors Memory's own "editing vs. deletion" precedent (memory-engine.md):
 * a goal's substantive identity isn't user-writable after creation, only its descriptive fields. */
export class UpdateGoalDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiPropertyOptional({ enum: GOAL_CATEGORIES })
  @IsOptional()
  @IsIn(GOAL_CATEGORIES)
  category?: GoalCategory;

  @ApiPropertyOptional({ enum: GOAL_DIFFICULTIES })
  @IsOptional()
  @IsIn(GOAL_DIFFICULTIES)
  difficulty?: GoalDifficulty;

  /** The one real toggle for Phase 7's Companion integration — PRIVATE (default) is never
   * referenced in the system prompt; COMPANION_VISIBLE is an explicit, reversible user choice,
   * mirroring Memory's own PRIVATE/COMPANION_ALLOWED precedent. */
  @ApiPropertyOptional({ enum: GOAL_VISIBILITIES })
  @IsOptional()
  @IsIn(GOAL_VISIBILITIES)
  visibility?: GoalVisibility;

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
