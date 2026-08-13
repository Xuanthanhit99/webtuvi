import { Body, Controller, Delete, HttpCode, HttpStatus, Res, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { AccountDeletionService } from './account-deletion.service';
import { DeleteAccountDto } from '../dto/delete-account.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { CookieService } from '../../auth/cookie.service';
import { CsrfService } from '../../common/csrf/csrf.service';

/**
 * Sprint 10 — a deliberate, explicit destructive operation: `DELETE /users/me`, never a GET,
 * requires the current password (same confirmation pattern `AuthService.changePassword` already
 * established), behind both `JwtAuthGuard` and the project-wide `CsrfGuard`. Clears this request's
 * own auth cookies immediately on success, mirroring `POST /auth/logout-all`'s exact pattern.
 */
@ApiTags('users')
@Controller('users/me')
@UseGuards(JwtAuthGuard)
export class AccountDeletionController {
  constructor(
    private readonly deletionService: AccountDeletionService,
    private readonly cookieService: CookieService,
    private readonly csrfService: CsrfService,
  ) {}

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Permanently delete the caller’s own account and personal data' })
  async deleteAccount(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: DeleteAccountDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.deletionService.deleteAccount(user.id, dto.password);
    this.cookieService.clearAuthCookies(res);
    this.cookieService.setCsrfCookie(res, this.csrfService.generateToken());
  }
}
