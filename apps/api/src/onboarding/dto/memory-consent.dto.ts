import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class MemoryConsentDto {
  @ApiProperty()
  @IsBoolean()
  accepted!: boolean;
}
