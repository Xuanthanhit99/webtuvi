import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import type { UserDto } from '@beaconvie/types';
import { AuthService } from './auth.service';
import { CookieService, REFRESH_TOKEN_COOKIE } from './cookie.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UsersService } from '../users/users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuthThrottlerGuard } from '../common/guards/auth-throttler.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { AUTH_RATE_LIMIT_MAX, AUTH_RATE_LIMIT_WINDOW_MS } from '../common/rate-limit.constants';

const AUTH_THROTTLE = { default: { limit: AUTH_RATE_LIMIT_MAX, ttl: AUTH_RATE_LIMIT_WINDOW_MS } };

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly cookieService: CookieService,
  ) {}

  @Post('register')
  @UseGuards(AuthThrottlerGuard)
  @Throttle(AUTH_THROTTLE)
  @ApiOperation({ summary: 'Create an account with email + password' })
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<UserDto> {
    const { user, tokens } = await this.authService.register(dto, req.headers['user-agent']);
    this.setAuthCookies(res, tokens);
    return this.usersService.toDto(user);
  }

  @Post('login')
  @UseGuards(AuthThrottlerGuard)
  @Throttle(AUTH_THROTTLE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log in with email + password' })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<UserDto> {
    const { user, tokens } = await this.authService.login(dto, req.headers['user-agent']);
    this.setAuthCookies(res, tokens);
    return this.usersService.toDto(user);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Silently rotate the session using the refresh-token cookie' })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<UserDto> {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];
    if (!refreshToken) {
      throw new UnauthorizedException({
        code: 'SESSION_EXPIRED',
        message: 'Your session has expired. Please log in again.',
      });
    }

    const { user, tokens } = await this.authService.refresh(refreshToken, req.headers['user-agent']);
    this.setAuthCookies(res, tokens);
    return this.usersService.toDto(user);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke the current session (this device only)' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<void> {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];
    await this.authService.logout(refreshToken);
    this.cookieService.clearAuthCookies(res);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Return the currently authenticated user' })
  async me(@CurrentUser() currentUser: AuthenticatedUser): Promise<UserDto> {
    const user = await this.usersService.findById(currentUser.id);
    if (!user) {
      throw new UnauthorizedException({
        code: 'SESSION_EXPIRED',
        message: 'Your session has expired. Please log in again.',
      });
    }
    return this.usersService.toDto(user);
  }

  @Post('forgot-password')
  @UseGuards(AuthThrottlerGuard)
  @Throttle(AUTH_THROTTLE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request a password reset email (never reveals whether the email exists)' })
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<{ message: string }> {
    await this.authService.forgotPassword(dto.email);
    return { message: 'If an account exists for that email, we’ve sent a reset link.' };
  }

  @Post('reset-password')
  @UseGuards(AuthThrottlerGuard)
  @Throttle(AUTH_THROTTLE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set a new password using a reset token' })
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<{ message: string }> {
    await this.authService.resetPassword(dto);
    return { message: 'Your password has been reset. Please log in.' };
  }

  private setAuthCookies(res: Response, tokens: { accessToken: string; refreshToken: string }): void {
    this.cookieService.setAccessTokenCookie(res, tokens.accessToken);
    this.cookieService.setRefreshTokenCookie(res, tokens.refreshToken);
  }
}
