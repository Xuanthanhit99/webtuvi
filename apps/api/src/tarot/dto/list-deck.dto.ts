import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import type { TarotArcana, TarotSuit } from '@prisma/client';

export const TAROT_ARCANA_VALUES: TarotArcana[] = ['MAJOR', 'MINOR'];
export const TAROT_SUIT_VALUES: TarotSuit[] = ['WANDS', 'CUPS', 'SWORDS', 'PENTACLES'];

export class ListDeckQueryDto {
  @ApiPropertyOptional({ enum: TAROT_ARCANA_VALUES })
  @IsOptional()
  @IsIn(TAROT_ARCANA_VALUES)
  arcana?: TarotArcana;

  @ApiPropertyOptional({ enum: TAROT_SUIT_VALUES })
  @IsOptional()
  @IsIn(TAROT_SUIT_VALUES)
  suit?: TarotSuit;

  /** Case-insensitive match against name/keywords/categories — a real DB query. */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(60)
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  category?: string;
}
