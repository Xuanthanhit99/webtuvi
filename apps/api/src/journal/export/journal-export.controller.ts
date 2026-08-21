import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle, Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { JournalExportService, type JournalAccountExportJobDto } from './journal-export.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { EXPORT_RATE_LIMIT_MAX, EXPORT_RATE_LIMIT_WINDOW_MS } from '../../common/rate-limit.constants';

@ApiTags('journal-export')
@Controller('journal/export')
@UseGuards(JwtAuthGuard)
export class JournalExportController {
  constructor(private readonly exportService: JournalExportService) {}

  @Post()
  // Same reasoning as MemoryExportController — a full account export is heavier than an
  // ordinary request, so it gets its own tight rate limit.
  @UseGuards(ThrottlerGuard)
  // Sprint 13: `payment` was missing here — every named throttler applies to every guarded route
  // by default unless skipped. Sprint 18B.12: `admin` was missing the same way (added after this
  // skip list was last updated — see auth.controller.ts's own fix for the full explanation).
  @SkipThrottle({ auth: true, companion: true, 'companion-ip': true, discovery: true, 'discovery-ip': true, payment: true, admin: true })
  @Throttle({ default: { limit: EXPORT_RATE_LIMIT_MAX, ttl: EXPORT_RATE_LIMIT_WINDOW_MS } })
  @ApiOperation({ summary: 'Export all of the caller’s own journal entries as JSON' })
  create(@CurrentUser() user: AuthenticatedUser): Promise<JournalAccountExportJobDto> {
    return this.exportService.createAccountExport(user.id);
  }

  @Get(':jobId')
  @ApiOperation({ summary: 'Fetch a completed account export by job id (available for 15 minutes)' })
  get(@CurrentUser() user: AuthenticatedUser, @Param('jobId') jobId: string): Promise<JournalAccountExportJobDto> {
    return this.exportService.getAccountExport(user.id, jobId);
  }
}
