import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsString } from 'class-validator';

/** Capped at a small number — this confirms a specific, just-shown set of candidates (see
 * CompanionForgetService's own DELETE_ABOUT_MAX_CANDIDATES), never an open-ended bulk delete. */
const MAX_CONFIRMABLE_MEMORIES = 10;

export class ConfirmDeleteDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_CONFIRMABLE_MEMORIES)
  @IsString({ each: true })
  memoryIds!: string[];
}
