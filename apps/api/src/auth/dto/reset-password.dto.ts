import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { Match } from '../../common/decorators/match.decorator';

const PASSWORD_HAS_NUMBER_OR_SYMBOL = /[0-9!@#$%^&*(),.?":{}|<>_\-+=[\]/\\;'~`]/;

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  token!: string;

  @ApiProperty({ example: 'correct-horse-9' })
  @IsString()
  @MinLength(8, { message: 'Passwords need at least 8 characters' })
  @MaxLength(128)
  @Matches(PASSWORD_HAS_NUMBER_OR_SYMBOL, {
    message: 'Passwords need at least one number or symbol',
  })
  password!: string;

  @ApiProperty({ example: 'correct-horse-9' })
  @IsString()
  @Match('password', { message: 'That password doesn’t match' })
  confirmPassword!: string;
}
