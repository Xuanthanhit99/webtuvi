import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { MAX_INPUT_LENGTH } from '../../safety/safety.service';

export class SendMessageDto {
  @ApiProperty({ example: "I don't know what to do about the new job." })
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_INPUT_LENGTH)
  content!: string;
}
