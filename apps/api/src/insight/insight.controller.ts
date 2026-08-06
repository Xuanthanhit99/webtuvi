import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import {
  InsightRecordService,
  type InsightStatisticsDto,
  type ListInsightsResult,
} from './record/insight-record.service';
import { InsightPresentationService, type CardsResult } from './presentation/insight-presentation.service';
import { ListInsightCandidatesQueryDto } from './dto/list-insight-candidates.dto';
import { ListInsightCardsQueryDto } from './dto/list-insight-cards.dto';
import { InsightTimelineQueryDto } from './dto/insight-timeline.dto';
import type { InsightCandidateDto } from './insight.mappers';
import type { InsightCard, InsightEvidenceCard, InsightTimelineResult } from './presentation/insight-presentation.types';

/**
 * Sprint 4C's original four routes (`statistics`/list/`:id`/`:id/archive`, via
 * `InsightRecordService`) plus Sprint 5A's Insight Experience additions (`cards`/`timeline`/
 * `:id/card`/`:id/evidence`/`:id/pin`/`:id/unpin`, via `InsightPresentationService`) — a
 * presentation layer over the same `InsightCandidate` rows, never a second generation path. Every
 * route is `JwtAuthGuard` + the project-wide `CsrfGuard`, implicitly ownership-scoped.
 * `GET /insight-candidates/statistics|cards|timeline` are registered before `GET :id` for the same
 * route-ordering reason Reflection/Memory/Journal's own controllers document.
 */
@ApiTags('insight-candidates')
@Controller('insight-candidates')
@UseGuards(JwtAuthGuard)
export class InsightController {
  constructor(
    private readonly recordService: InsightRecordService,
    private readonly presentationService: InsightPresentationService,
  ) {}

  @Get('statistics')
  @ApiOperation({ summary: 'Counts by status/category and average priority for the caller' })
  statistics(@CurrentUser() user: AuthenticatedUser): Promise<InsightStatisticsDto> {
    return this.recordService.statistics(user.id);
  }

  @Get('cards')
  @ApiOperation({ summary: 'Insight Experience (Sprint 5A): rendered InsightCards, filterable by priority/category/date/status/source/pinned' })
  cards(@CurrentUser() user: AuthenticatedUser, @Query() query: ListInsightCardsQueryDto): Promise<CardsResult> {
    return this.presentationService.cards(user.id, {
      category: query.category,
      status: query.status,
      priorityTier: query.priorityTier,
      source: query.source,
      pinned: query.pinned,
      from: query.from,
      to: query.to,
      sort: query.sort,
      page: query.page,
      pageSize: query.pageSize,
    });
  }

  @Get('timeline')
  @ApiOperation({ summary: 'Insight Experience (Sprint 5A): Today/7 days/30 days/custom range timeline, grouped by category/priority/topic' })
  timeline(@CurrentUser() user: AuthenticatedUser, @Query() query: InsightTimelineQueryDto): Promise<InsightTimelineResult> {
    return this.presentationService.timeline(user.id, {
      range: query.range,
      from: query.from,
      to: query.to,
      groupBy: query.groupBy,
      category: query.category,
    });
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

  @Get(':id/card')
  @ApiOperation({ summary: 'Insight Experience (Sprint 5A): a single rendered InsightCard by id' })
  card(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<InsightCard> {
    return this.presentationService.card(user.id, id);
  }

  @Get(':id/evidence')
  @ApiOperation({ summary: 'Insight Experience (Sprint 5A): Evidence View — every real Reflection/Memory/Journal/Activity record behind this insight' })
  evidence(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<InsightEvidenceCard[]> {
    return this.presentationService.evidence(user.id, id);
  }

  @Post(':id/pin')
  @ApiOperation({ summary: 'Insight Experience (Sprint 5A): pin an insight (display-only, never affects generation)' })
  pin(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<InsightCard> {
    return this.presentationService.setPinned(user.id, id, true);
  }

  @Post(':id/unpin')
  @ApiOperation({ summary: 'Insight Experience (Sprint 5A): unpin an insight' })
  unpin(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<InsightCard> {
    return this.presentationService.setPinned(user.id, id, false);
  }

  @Post(':id/archive')
  @ApiOperation({ summary: 'Archive an insight candidate (never resurrected by later regeneration)' })
  archive(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<InsightCandidateDto> {
    return this.recordService.archive(user.id, id);
  }
}
