import { ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsIn, IsInt, IsOptional, IsString, MaxLength, MinLength, Min, Max } from 'class-validator';
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  selectionToken?: string;

  @ApiPropertyOptional({ type: [Number] })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(77, { each: true })
  selectedPositions?: number[];
}

export class CreateTarotSelectionSessionDto {
  @IsIn(TAROT_READING_TYPES)
  type!: TarotReadingType;
}
