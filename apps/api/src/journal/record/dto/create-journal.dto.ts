import { ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import type { JournalMood } from '@prisma/client';

const MOODS: JournalMood[] = ['GREAT', 'GOOD', 'OKAY', 'LOW', 'DIFFICULT'];
const MAX_TAGS = 20;

/**
 * Deliberately has no `sourceConversationId`/`sourceMessageId`/`sourceType` fields — those are
 * only ever set by `JournalRecordService.create()`'s own internal `source` parameter, populated
 * by `CompanionJournalService` after it has independently verified conversation/message
 * ownership (see companion-journal.service.ts). A public `POST /journal` request can never claim
 * to have come from a conversation it doesn't own, because the field doesn't exist on this DTO
 * at all — not merely validated away, structurally absent.
 */
export class CreateJournalDto {
  /** Optional — a brand-new draft (see `/journal/new`, which creates a real row immediately so
   * autosave/"recovery after refresh" work from the very first keystroke) starts with no title
   * at all; the editor shows "Untitled entry" as a placeholder until the user types one. */
  @ApiPropertyOptional({ example: 'A good day' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ example: 'Today I...' })
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
}
