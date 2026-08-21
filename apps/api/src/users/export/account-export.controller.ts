import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle, Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AccountExportService, type AccountExportJobDto } from './account-export.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { EXPORT_RATE_LIMIT_MAX, EXPORT_RATE_LIMIT_WINDOW_MS } from '../../common/rate-limit.constants';

/**
 * Sprint 10 — account-wide data export, mirroring `MemoryExportController`'s route shape and
 * rate-limit pattern exactly: its own dedicated throttler bucket, explicitly skipping the
 * unrelated 'auth'/'companion'/'companion-ip' buckets (the exact symmetric fix `f8fcba1`
 * established for keeping route-specific throttlers from bleeding into each other).
 */
@ApiTags('users')
@Controller('users/me/export')
@UseGuards(JwtAuthGuard)
export class AccountExportController {
  constructor(private readonly exportService: AccountExportService) {}

  @Post()
  @UseGuards(ThrottlerGuard)
  // Sprint 13: `payment` was missing here — every named throttler applies to every guarded route
  // by default unless skipped. Sprint 18B.12: `admin` was missing the same way.
  @SkipThrottle({ auth: true, companion: true, 'companion-ip': true, discovery: true, 'discovery-ip': true, payment: true, admin: true })
  // Mirrors MemoryExportController's own precedent value exactly (5/60s, IP-tracked — the
  // `default` throttler has no per-user getTracker, same as MemoryExportController's).
  @Throttle({ default: { limit: EXPORT_RATE_LIMIT_MAX, ttl: EXPORT_RATE_LIMIT_WINDOW_MS } })
  @ApiOperation({ summary: 'Export everything the caller owns across the account' })
  create(@CurrentUser() user: AuthenticatedUser): Promise<AccountExportJobDto> {
    return this.exportService.createExport(user.id);
  }

  @Get(':jobId')
  @ApiOperation({ summary: 'Fetch a completed account export by job id (available for 15 minutes)' })
  get(@CurrentUser() user: AuthenticatedUser, @Param('jobId') jobId: string): Promise<AccountExportJobDto> {
    return this.exportService.getExport(user.id, jobId);
  }
}
