import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ResendVerificationDto {
  @ApiProperty({ example: 'alex@example.com' })
  @IsEmail({}, { message: 'That doesn’t look like a valid email' })
  email!: string;
}
