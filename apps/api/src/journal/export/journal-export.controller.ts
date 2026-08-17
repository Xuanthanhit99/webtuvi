import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle, Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { JournalExportService, type JournalAccountExportJobDto } from './journal-export.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

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
  // by default unless skipped.
  @SkipThrottle({ auth: true, companion: true, 'companion-ip': true, discovery: true, 'discovery-ip': true, payment: true })
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
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
