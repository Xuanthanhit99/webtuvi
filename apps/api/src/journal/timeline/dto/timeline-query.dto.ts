import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsISO8601, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

const GROUPINGS = ['day', 'week', 'month'] as const;
export type TimelineGrouping = (typeof GROUPINGS)[number];

export class TimelineQueryDto {
  @ApiPropertyOptional({ enum: GROUPINGS, description: 'How entries are bucketed in the response.' })
  @IsOptional()
  @IsIn(GROUPINGS)
  groupBy?: TimelineGrouping;

  @ApiPropertyOptional({ description: 'Include archived entries in the timeline (excluded by default).' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeArchived?: boolean;

  @ApiPropertyOptional({ description: 'Opaque cursor — the createdAt ISO timestamp of the last item from the previous page.' })
  @IsOptional()
  @IsISO8601()
  cursor?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
