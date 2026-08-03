import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import type { MemoryVisibility } from '@prisma/client';

const VISIBILITIES: MemoryVisibility[] = ['PRIVATE', 'COMPANION_ALLOWED'];

/**
 * Deliberately does not include `summary`, `structuredPayload`, or `type` —
 * see MemoryRecordService's class docstring for why (Product Bible: memory
 * content is never directly user-writable, only deletable). `title` is a
 * user-facing label, not the memory's substantive content, so it's the one
 * field beyond `visibility` this sprint allows editing.
 */
export class UpdateMemoryDto {
  @ApiPropertyOptional({ example: 'New job at a startup' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ enum: VISIBILITIES })
  @IsOptional()
  @IsIn(VISIBILITIES)
  visibility?: MemoryVisibility;
}
