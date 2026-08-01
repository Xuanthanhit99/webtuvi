import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { Match } from '../../common/decorators/match.decorator';

const PASSWORD_HAS_NUMBER_OR_SYMBOL = /[0-9!@#$%^&*(),.?":{}|<>_\-+=[\]/\\;'~`]/;

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  currentPassword!: string;

  @ApiProperty({ example: 'correct-horse-9' })
  @IsString()
  @MinLength(8, { message: 'Passwords need at least 8 characters' })
  @MaxLength(128)
  @Matches(PASSWORD_HAS_NUMBER_OR_SYMBOL, {
    message: 'Passwords need at least one number or symbol',
  })
  newPassword!: string;

  @ApiProperty({ example: 'correct-horse-9' })
  @IsString()
  @Match('newPassword', { message: 'That password doesn’t match' })
  confirmNewPassword!: string;
}
