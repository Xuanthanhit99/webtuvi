import { ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsBoolean, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import type { JournalMood, JournalVisibility } from '@prisma/client';

const MOODS: JournalMood[] = ['GREAT', 'GOOD', 'OKAY', 'LOW', 'DIFFICULT'];
const VISIBILITIES: JournalVisibility[] = ['PRIVATE', 'SHARED'];
const MAX_TAGS = 20;

/** Unlike Memory's UpdateMemoryDto, Journal content genuinely is user-editable — a journal entry
 * is directly authored by the user, not a system-proposed candidate, so there is no "content is
 * never directly writable" rule to reconcile here (see docs/architecture/journal-foundation.md
 * "Editing"). Every field is optional; the service only touches what's actually provided. */
export class UpdateJournalDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200_000)
  content?: string;

  @ApiPropertyOptional({ enum: MOODS })
  @IsOptional()
  @IsIn(MOODS)
  mood?: JournalMood;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_TAGS)
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ enum: VISIBILITIES })
  @IsOptional()
  @IsIn(VISIBILITIES)
  visibility?: JournalVisibility;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  pinned?: boolean;
}
