import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

/** Mobile has no refresh-token cookie to read (see auth.controller.ts's web /auth/refresh, which
 *  reads REFRESH_TOKEN_COOKIE) — the token travels in the body instead. */
export class MobileRefreshDto {
  @ApiProperty()
  @IsString()
  @MinLength(1, { message: 'Missing refresh token' })
  refreshToken!: string;
}
