import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import type { MemoryConsentMode } from '@prisma/client';

const MODES: MemoryConsentMode[] = ['ASK_EVERY_TIME', 'ALLOW_SELECTED', 'ALLOW_TYPE', 'DENY_TYPE', 'DISABLED'];

export class UpdateTypeConsentDto {
  @ApiProperty({ enum: MODES })
  @IsIn(MODES)
  mode!: MemoryConsentMode;
}
