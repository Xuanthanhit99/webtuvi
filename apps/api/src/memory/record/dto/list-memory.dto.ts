import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsISO8601, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import type { MemoryStatus, MemoryType } from '@prisma/client';

const TYPES: MemoryType[] = [
  'IDENTITY', 'PREFERENCE', 'GOAL', 'RELATIONSHIP', 'HABIT', 'ROUTINE', 'ACHIEVEMENT', 'CHALLENGE',
  'EMOTION', 'IMPORTANT_EVENT', 'DECISION', 'INTEREST', 'WORK', 'STUDY', 'PET', 'LOCATION_PREFERENCE',
  'HEALTH', 'CUSTOM',
];

/** DELETED is deliberately excluded — a deleted memory can never be requested back, even explicitly. */
const STATUSES: Exclude<MemoryStatus, 'DELETED'>[] = ['CANDIDATE', 'PENDING_CONSENT', 'ACCEPTED', 'REJECTED', 'ARCHIVED', 'EXPIRED'];

export class ListMemoryQueryDto {
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

  @ApiPropertyOptional({ enum: ['newest', 'oldest'] })
  @IsOptional()
  @IsIn(['newest', 'oldest'])
  sort?: 'newest' | 'oldest';

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
