import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsISO8601, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';
import type { JournalMood, JournalState } from '@prisma/client';

const MOODS: JournalMood[] = ['GREAT', 'GOOD', 'OKAY', 'LOW', 'DIFFICULT'];
/** DELETED is deliberately excluded from the general list filter — same reasoning as Memory's
 * own ListMemoryQueryDto: a soft-deleted entry is reached only through the dedicated "recently
 * deleted" view (`state=DELETED` is still accepted there specifically, see the controller), never
 * as a value a generic list call can casually request. */
const LISTABLE_STATES: Exclude<JournalState, 'DELETED'>[] = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];

/**
 * Doubles as Phase 6's search endpoint — `q` performs a deterministic, case-insensitive
 * substring match over title+content (Postgres `ILIKE`, no embeddings/full-text-search
 * infrastructure). Filtering (Phase 2's "Filter/Tag/Mood") and searching are the same query
 * shape, so this is one endpoint, not two that could drift out of sync with each other.
 */
export class ListJournalQueryDto {
  @ApiPropertyOptional({ description: 'Deterministic substring search over title + content.' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  q?: string;

  @ApiPropertyOptional({ enum: LISTABLE_STATES })
  @IsOptional()
  @IsIn([...LISTABLE_STATES, 'DELETED'])
  state?: JournalState;

  @ApiPropertyOptional({ enum: MOODS })
  @IsOptional()
  @IsIn(MOODS)
  mood?: JournalMood;

  @ApiPropertyOptional({ description: 'A single tag to filter by.' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  tag?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601()
  to?: string;

  @ApiPropertyOptional({ enum: ['newest', 'oldest', 'recently_edited'] })
  @IsOptional()
  @IsIn(['newest', 'oldest', 'recently_edited'])
  sort?: 'newest' | 'oldest' | 'recently_edited';

  @ApiPropertyOptional({ description: 'Filter to only pinned entries — Phase 4\'s "Pinned entries" timeline section.' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  pinned?: boolean;

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
