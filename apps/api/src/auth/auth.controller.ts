import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import type { SessionDto, UserDto } from '@beaconvie/types';
import { AuthService } from './auth.service';
import { CookieService, REFRESH_TOKEN_COOKIE } from './cookie.service';
import { EmailVerificationService } from './email-verification.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { UsersService } from '../users/users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuthThrottlerGuard } from '../common/guards/auth-throttler.guard';
import { LoginThrottlerGuard } from '../common/guards/login-throttler.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { AUTH_RATE_LIMIT_MAX, AUTH_RATE_LIMIT_WINDOW_MS } from '../common/rate-limit.constants';
import { CsrfService } from '../common/csrf/csrf.service';
import { SkipCsrf } from '../common/csrf/skip-csrf.decorator';

const AUTH_THROTTLE = { default: { limit: AUTH_RATE_LIMIT_MAX, ttl: AUTH_RATE_LIMIT_WINDOW_MS } };

// Every named throttler registered in ThrottlerModule (app.module.ts) is checked against every
// guarded route by default, not just the one(s) named in that route's own @Throttle() override
// (see CompanionThrottlerGuard's docstring, which documents the same mechanism from the other
// side: Companion routes skip `auth` so its tighter limit doesn't leak onto chat traffic). Without
// this, every route below is also incidentally governed by the much tighter, short-window
// `companion` (per-user/IP, ~20/60s) and `companion-ip` (~500/60s) buckets meant only for AI
// generation endpoints — unrelated to registration/login/password flows, and easily tripped by
// legitimate traffic (or a test suite) making more than ~20 auth requests from one IP within a
// minute, long before the real 200-per-15-minutes auth ceiling is anywhere close to being reached.
const SKIP_UNRELATED_THROTTLERS = { companion: true, 'companion-ip': true };

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly cookieService: CookieService,
    private readonly emailVerificationService: EmailVerificationService,
    private readonly csrfService: CsrfService,
  ) {}

  @Get('csrf-token')
  @ApiOperation({ summary: 'Issue a CSRF token cookie + value for X-CSRF-Token on later mutations' })
  csrfToken(@Res({ passthrough: true }) res: Response): { csrfToken: string } {
    const token = this.csrfService.generateToken();
    this.cookieService.setCsrfCookie(res, token);
    return { csrfToken: token };
  }

  @Post('register')
  @SkipCsrf()
  @UseGuards(AuthThrottlerGuard)
  @Throttle(AUTH_THROTTLE)
  @SkipThrottle(SKIP_UNRELATED_THROTTLERS)
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
  @SkipCsrf()
  @UseGuards(LoginThrottlerGuard)
  @Throttle(AUTH_THROTTLE)
  @SkipThrottle(SKIP_UNRELATED_THROTTLERS)
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
  @SkipCsrf()
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
    this.cookieService.setCsrfCookie(res, this.csrfService.generateToken());
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
  @SkipCsrf()
  @UseGuards(AuthThrottlerGuard)
  @Throttle(AUTH_THROTTLE)
  @SkipThrottle(SKIP_UNRELATED_THROTTLERS)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request a password reset email (never reveals whether the email exists)' })
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<{ message: string }> {
    await this.authService.forgotPassword(dto.email);
    return { message: 'If an account exists for that email, we’ve sent a reset link.' };
  }

  @Post('reset-password')
  @SkipCsrf()
  @UseGuards(AuthThrottlerGuard)
  @Throttle(AUTH_THROTTLE)
  @SkipThrottle(SKIP_UNRELATED_THROTTLERS)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set a new password using a reset token' })
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<{ message: string }> {
    await this.authService.resetPassword(dto);
    return { message: 'Your password has been reset. Please log in.' };
  }

  @Post('verify-email')
  @SkipCsrf()
  @UseGuards(AuthThrottlerGuard)
  @Throttle(AUTH_THROTTLE)
  @SkipThrottle(SKIP_UNRELATED_THROTTLERS)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm an email address using a verification token' })
  async verifyEmail(@Body() dto: VerifyEmailDto): Promise<{ message: string }> {
    await this.emailVerificationService.verify(dto.token);
    return { message: 'Your email has been verified.' };
  }

  @Post('resend-verification')
  @SkipCsrf()
  @UseGuards(AuthThrottlerGuard)
  @Throttle(AUTH_THROTTLE)
  @SkipThrottle(SKIP_UNRELATED_THROTTLERS)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend the verification email (never reveals whether the email exists)' })
  async resendVerification(@Body() dto: ResendVerificationDto): Promise<{ message: string }> {
    await this.emailVerificationService.resend(dto.email);
    return { message: 'If that email needs verifying, we’ve sent a new link.' };
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard, AuthThrottlerGuard)
  @Throttle(AUTH_THROTTLE)
  @SkipThrottle(SKIP_UNRELATED_THROTTLERS)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change password; revokes every other session' })
  async changePassword(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    await this.authService.changePassword(currentUser.id, currentUser.sessionId, dto);
    return { message: 'Your password has been changed. Other devices have been signed out.' };
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List this account’s active sessions' })
  async listSessions(@CurrentUser() currentUser: AuthenticatedUser): Promise<SessionDto[]> {
    return this.authService.listSessions(currentUser.id, currentUser.sessionId);
  }

  @Delete('sessions/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke one session; clears cookies if it was the current one' })
  async revokeSession(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const { revokedCurrent } = await this.authService.revokeSession(currentUser.id, id, currentUser.sessionId);
    if (revokedCurrent) {
      this.cookieService.clearAuthCookies(res);
      this.cookieService.setCsrfCookie(res, this.csrfService.generateToken());
    }
  }

  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke every session for this account, including the current one' })
  async logoutAll(@CurrentUser() currentUser: AuthenticatedUser, @Res({ passthrough: true }) res: Response): Promise<void> {
    await this.authService.logoutAll(currentUser.id);
    this.cookieService.clearAuthCookies(res);
    this.cookieService.setCsrfCookie(res, this.csrfService.generateToken());
  }

  private setAuthCookies(res: Response, tokens: { accessToken: string; refreshToken: string }): void {
    this.cookieService.setAccessTokenCookie(res, tokens.accessToken);
    this.cookieService.setRefreshTokenCookie(res, tokens.refreshToken);
    // Rotate the CSRF token alongside every auth-state change (register/login/refresh).
    this.cookieService.setCsrfCookie(res, this.csrfService.generateToken());
  }
}
