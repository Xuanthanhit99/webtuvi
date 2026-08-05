import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import {
  InsightRecordService,
  type InsightStatisticsDto,
  type ListInsightsResult,
} from './record/insight-record.service';
import { ListInsightCandidatesQueryDto } from './dto/list-insight-candidates.dto';
import type { InsightCandidateDto } from './insight.mappers';

/**
 * Phase 6 API — exactly the four endpoints this sprint's brief specifies. No feed/timeline/
 * groups/export surfaces (unlike Reflection Foundation's own, larger API) — this sprint prepares
 * structured evidence for a future Sprint 5, it is not a second user-facing product surface.
 * Every route is `JwtAuthGuard` + the project-wide `CsrfGuard`, implicitly ownership-scoped.
 * `GET /insight-candidates/statistics` is registered before `:id` for the same route-ordering
 * reason Reflection/Memory/Journal's own controllers document.
 */
@ApiTags('insight-candidates')
@Controller('insight-candidates')
@UseGuards(JwtAuthGuard)
export class InsightController {
  constructor(private readonly recordService: InsightRecordService) {}

  @Get('statistics')
  @ApiOperation({ summary: 'Counts by status/category and average priority for the caller' })
  statistics(@CurrentUser() user: AuthenticatedUser): Promise<InsightStatisticsDto> {
    return this.recordService.statistics(user.id);
  }

  @Get()
  @ApiOperation({ summary: 'List/filter the caller’s own insight candidates, paginated' })
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: ListInsightCandidatesQueryDto): Promise<ListInsightsResult> {
    return this.recordService.list(user.id, {
      category: query.category,
      status: query.status,
      page: query.page,
      pageSize: query.pageSize,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one insight candidate (owner only) — includes evidence, relationships, and priority explanation' })
  getOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<InsightCandidateDto> {
    return this.recordService.getOne(user.id, id);
  }

  @Post(':id/archive')
  @ApiOperation({ summary: 'Archive an insight candidate (never resurrected by later regeneration)' })
  archive(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<InsightCandidateDto> {
    return this.recordService.archive(user.id, id);
  }
}
