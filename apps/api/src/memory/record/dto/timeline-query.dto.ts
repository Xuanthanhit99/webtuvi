import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsISO8601, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import type { MemoryStatus, MemoryType } from '@prisma/client';

const TYPES: MemoryType[] = [
  'IDENTITY', 'PREFERENCE', 'GOAL', 'RELATIONSHIP', 'HABIT', 'ROUTINE', 'ACHIEVEMENT', 'CHALLENGE',
  'EMOTION', 'IMPORTANT_EVENT', 'DECISION', 'INTEREST', 'WORK', 'STUDY', 'PET', 'LOCATION_PREFERENCE',
  'HEALTH', 'CUSTOM',
];

const STATUSES: Exclude<MemoryStatus, 'DELETED'>[] = ['CANDIDATE', 'PENDING_CONSENT', 'ACCEPTED', 'REJECTED', 'ARCHIVED', 'EXPIRED'];

export class TimelineQueryDto {
  @ApiPropertyOptional({ enum: TYPES })
  @IsOptional()
  @IsIn(TYPES)
  type?: MemoryType;

  @ApiPropertyOptional({ enum: STATUSES })
  @IsOptional()
  @IsIn(STATUSES)
  status?: Exclude<MemoryStatus, 'DELETED'>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601()
  to?: string;

  @ApiPropertyOptional({ description: 'Opaque cursor — the createdAt ISO timestamp of the last item from the previous page.' })
  @IsOptional()
  @IsISO8601()
  cursor?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}
