import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class SendCompanionMessageDto {
  @ApiProperty({ example: "I don't know what to do." })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content!: string;
}
