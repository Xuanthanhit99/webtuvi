import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle, Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { MemoryExportService, type MemoryExportJobDto } from './memory-export.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('memory-export')
@Controller('memory/export')
@UseGuards(JwtAuthGuard)
export class MemoryExportController {
  constructor(private readonly exportService: MemoryExportService) {}

  @Post()
  // A full data export is heavier than an ordinary request, so it gets its
  // own tight rate limit rather than the 'default' throttler's normal
  // 1000/60s — every other named throttler is unrelated to this route and is
  // skipped so only this override applies (Sprint 13: `payment` was missing).
  @UseGuards(ThrottlerGuard)
  @SkipThrottle({ auth: true, companion: true, 'companion-ip': true, discovery: true, 'discovery-ip': true, payment: true })
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Export the caller’s own memories, versions, consent settings, and activity history' })
  create(@CurrentUser() user: AuthenticatedUser): Promise<MemoryExportJobDto> {
    return this.exportService.createExport(user.id);
  }

  @Get(':jobId')
  @ApiOperation({ summary: 'Fetch a completed export by job id (available for 15 minutes)' })
  get(@CurrentUser() user: AuthenticatedUser, @Param('jobId') jobId: string): Promise<MemoryExportJobDto> {
    return this.exportService.getExport(user.id, jobId);
  }
}
