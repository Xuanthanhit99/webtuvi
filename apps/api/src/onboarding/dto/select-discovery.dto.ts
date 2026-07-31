import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class SelectDiscoveryDto {
  @ApiProperty({ enum: ['accepted', 'skipped'] })
  @IsIn(['accepted', 'skipped'])
  choice!: 'accepted' | 'skipped';
}
