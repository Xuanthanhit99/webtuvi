import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import type { MemoryType } from '@prisma/client';
import { MEMORY_TYPES } from './memory-type.constants';

export class ConfirmNeverRememberDto {
  @ApiProperty({ enum: MEMORY_TYPES })
  @IsIn(MEMORY_TYPES)
  type!: MemoryType;
}
