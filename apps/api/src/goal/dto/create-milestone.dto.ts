import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsISO8601, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import type { GoalMilestoneType } from '@prisma/client';

const MILESTONE_TYPES: GoalMilestoneType[] = ['AUTOMATIC', 'MANUAL'];

/** `targetCount` is required for `type: AUTOMATIC` (validated by the service layer, which is where
 * `GoalProgressEngine`'s own real evidence-count check lives) — a `MANUAL` milestone ignores it,
 * since it only ever changes via an explicit user action. */
export class CreateMilestoneDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsIn(MILESTONE_TYPES)
  type!: GoalMilestoneType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1_000_000)
  targetCount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601()
  dueDate?: string;
}
