import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import type { GoalCategory, GoalStatus } from '@prisma/client';
import { GOAL_CATEGORIES } from './create-goal.dto';

export const GOAL_STATUSES: GoalStatus[] = ['ACTIVE', 'PAUSED', 'COMPLETED', 'ABANDONED', 'ARCHIVED', 'DELETED'];

export class ListGoalsQueryDto {
  @ApiPropertyOptional({ enum: GOAL_STATUSES })
  @IsOptional()
  @IsIn(GOAL_STATUSES)
  status?: GoalStatus;

  @ApiPropertyOptional({ enum: GOAL_CATEGORIES })
  @IsOptional()
  @IsIn(GOAL_CATEGORIES)
  category?: GoalCategory;

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
