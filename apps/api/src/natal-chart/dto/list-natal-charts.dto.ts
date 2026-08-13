import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import type { NatalChartStatus } from '@prisma/client';

export const NATAL_CHART_STATUSES: NatalChartStatus[] = ['ACTIVE', 'ARCHIVED', 'DELETED'];

export class ListNatalChartsQueryDto {
  @ApiPropertyOptional({ enum: NATAL_CHART_STATUSES })
  @IsOptional()
  @IsIn(NATAL_CHART_STATUSES)
  status?: NatalChartStatus;

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
