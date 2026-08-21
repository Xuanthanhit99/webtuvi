import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { DiscoveryThrottlerGuard } from '../common/guards/discovery-throttler.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { ReportReadinessService } from './readiness/report-readiness.service';
import { ReportRecordService, type ListReportsResult } from './record/report-record.service';
import { ListReportsQueryDto } from './dto/list-reports.dto';
import type { ReportDto } from './reports.mappers';
import type { ReportReadinessDto } from './reports.types';

/**
 * Sprint 16 — Personal Destiny Report API. Every route sits behind `JwtAuthGuard` + the
 * project-wide CSRF middleware; every report query is `userId`-scoped
 * (`ReportRecordService.findOwned` 404s identically for "doesn't exist" and "belongs to someone
 * else"). Generation and regeneration reuse `DiscoveryThrottlerGuard` — the same shared rate-limit
 * bucket Tarot/Numerology/Natal Chart's own AI-generating retry routes use (locked decision: no
 * new isolated bucket, same abuse profile).
 */
@ApiTags('reports')
@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(
    private readonly readiness: ReportReadinessService,
    private readonly records: ReportRecordService,
  ) {}

  @Get('readiness')
  @ApiOperation({ summary: 'Check whether the caller has both required sources (Natal Chart + Numerology) for a Personal Destiny Report' })
  checkReadiness(@CurrentUser() user: AuthenticatedUser): Promise<ReportReadinessDto> {
    return this.readiness.check(user.id);
  }

  @Post()
  @UseGuards(DiscoveryThrottlerGuard)
  @SkipThrottle({ auth: true, companion: true, 'companion-ip': true, payment: true, admin: true })
  @ApiOperation({ summary: 'Generate a new Personal Destiny Report (Premium; requires both Natal Chart and Numerology)' })
  generate(@CurrentUser() user: AuthenticatedUser): Promise<ReportDto> {
    return this.records.generate(user.id);
  }

  @Get()
  @ApiOperation({ summary: 'List/paginate the caller’s own report history, newest first' })
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: ListReportsQueryDto): Promise<ListReportsResult> {
    return this.records.list(user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one report by id (owner only)' })
  getOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<ReportDto> {
    return this.records.getOne(user.id, id);
  }

  @Post(':id/regenerate')
  @UseGuards(DiscoveryThrottlerGuard)
  @SkipThrottle({ auth: true, companion: true, 'companion-ip': true, payment: true, admin: true })
  @ApiOperation({ summary: 'Regenerate a Personal Destiny Report from a fresh source snapshot (Premium) — creates a new report, never overwrites the one at :id' })
  regenerate(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<ReportDto> {
    // `id` identifies which prior report the user regenerated from, for owner-scoped audit/UX
    // purposes only — confirmed owned, then a fresh report is generated exactly like POST /reports.
    return this.records.getOne(user.id, id).then(() => this.records.regenerate(user.id));
  }
}
