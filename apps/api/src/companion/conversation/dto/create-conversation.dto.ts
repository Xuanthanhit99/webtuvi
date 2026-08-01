import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateConversationDto {
  @ApiPropertyOptional({ example: 'Starting a new job' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;
}
