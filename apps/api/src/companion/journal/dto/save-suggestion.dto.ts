import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class SaveSuggestionDto {
  @ApiProperty()
  @IsString()
  conversationId!: string;

  @ApiProperty()
  @IsString()
  messageId!: string;
}
