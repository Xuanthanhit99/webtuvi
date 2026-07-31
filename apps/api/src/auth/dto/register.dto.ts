import { ApiProperty } from '@nestjs/swagger';
import { Equals, IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { Match } from '../../common/decorators/match.decorator';

// Password rule intentionally mirrors docs/reference Module 6 §6: minimum 8 characters
// plus at least one number or symbol. A stricter multi-class composition rule was
// considered and rejected — see docs/security/sprint-1-security.md for the rationale.
const PASSWORD_HAS_NUMBER_OR_SYMBOL = /[0-9!@#$%^&*(),.?":{}|<>_\-+=[\]/\\;'~`]/;

export class RegisterDto {
  @ApiProperty({ example: 'alex@example.com' })
  @IsEmail({}, { message: 'That doesn’t look like a valid email' })
  @MaxLength(255)
  email!: string;

  @ApiProperty({ example: 'Alex' })
  @IsString()
  @MinLength(1, { message: 'Please tell us what to call you' })
  @MaxLength(80)
  displayName!: string;

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

  @ApiProperty({ example: true })
  @Equals(true, { message: 'You need to accept the Terms and Privacy Notice to continue' })
  acceptedTerms!: boolean;
}
