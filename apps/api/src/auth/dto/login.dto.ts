import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'alex@example.com' })
  @IsEmail({}, { message: 'That doesn’t look like a valid email' })
  email!: string;

  @ApiProperty({ example: 'correct-horse-9' })
  @IsString()
  @MinLength(1, { message: 'Please enter your password' })
  password!: string;
}
