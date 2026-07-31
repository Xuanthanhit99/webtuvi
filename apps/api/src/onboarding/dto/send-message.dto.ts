import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({ example: 'Starting a new job next week and feeling nervous about it.' })
  @IsString()
  @MinLength(1, { message: 'Say anything — even something small' })
  @MaxLength(2000)
  content!: string;
}
