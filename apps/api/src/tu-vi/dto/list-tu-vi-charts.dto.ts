import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import type { TuViChartStatus } from '@prisma/client';

export const TU_VI_CHART_STATUSES: TuViChartStatus[] = ['ACTIVE', 'ARCHIVED', 'DELETED'];

export class ListTuViChartsQueryDto {
  @ApiPropertyOptional({ enum: TU_VI_CHART_STATUSES })
  @IsOptional()
  @IsIn(TU_VI_CHART_STATUSES)
  status?: TuViChartStatus;

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
