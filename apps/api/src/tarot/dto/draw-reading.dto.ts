import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import type { TarotReadingType } from '@prisma/client';

export const TAROT_READING_TYPES: TarotReadingType[] = ['DAILY_DRAW', 'SINGLE_CARD', 'THREE_CARD'];

export class DrawReadingDto {
  @IsIn(TAROT_READING_TYPES)
  type!: TarotReadingType;

  /** Optional — Daily Draw never requires one; Single Card/Three Card may carry the user's own
   * real question. Never fabricated if omitted. */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  question?: string;
}
