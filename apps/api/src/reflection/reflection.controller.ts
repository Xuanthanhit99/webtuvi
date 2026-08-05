import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import {
  ReflectionRecordService,
  type ListReflectionsResult,
  type ReflectionGroupDto,
  type ReflectionStatisticsDto,
  type TimelineResult,
} from './record/reflection-record.service';
import { ListReflectionsQueryDto } from './dto/list-reflections.dto';
import { TimelineReflectionsQueryDto } from './dto/timeline-reflections.dto';
import { FeedReflectionsQueryDto } from './dto/feed-reflections.dto';
import type { ReflectionCandidateDto } from './reflection.mappers';

/**
 * Phase 8 API. Every route is ownership-scoped implicitly — every underlying service query is
 * filtered by the caller's own `userId` (see ReflectionRecordService) — and guarded by the same
 * `JwtAuthGuard` + project-wide `CsrfGuard` as every other module. `GET /reflections/timeline` is
 * registered before `GET /reflections/:id` for the same route-ordering reason Memory/Journal's
 * own controllers document.
 */
@ApiTags('reflections')
@Controller('reflections')
@UseGuards(JwtAuthGuard)
export class ReflectionController {
  constructor(private readonly recordService: ReflectionRecordService) {}

  @Get('timeline')
  @ApiOperation({ summary: 'Today/This week/Last week/Last month grouped timeline, or a custom from/to range' })
  timeline(@CurrentUser() user: AuthenticatedUser, @Query() query: TimelineReflectionsQueryDto): Promise<TimelineResult> {
    return this.recordService.timeline(user.id, {
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
      sort: query.sort,
      category: query.category,
    });
  }

  @Get('feed')
  @ApiOperation({ summary: 'Active (READY) reflection candidates, ranked by score' })
  feed(@CurrentUser() user: AuthenticatedUser, @Query() query: FeedReflectionsQueryDto): Promise<ReflectionCandidateDto[]> {
    return this.recordService.feed(user.id, query.limit);
  }

  @Get('groups')
  @ApiOperation({ summary: 'Deterministic grouping of active reflection candidates by their shared groupKey' })
  groups(@CurrentUser() user: AuthenticatedUser): Promise<ReflectionGroupDto[]> {
    return this.recordService.groups(user.id);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Counts by state/category/trigger and dismissal/archive rates for the caller' })
  statistics(@CurrentUser() user: AuthenticatedUser): Promise<ReflectionStatisticsDto> {
    return this.recordService.statistics(user.id);
  }

  @Get()
  @ApiOperation({ summary: 'List/filter the caller’s own reflection candidates, paginated' })
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: ListReflectionsQueryDto): Promise<ListReflectionsResult> {
    return this.recordService.list(user.id, {
      category: query.category,
      trigger: query.trigger,
      state: query.state,
      sort: query.sort,
      page: query.page,
      pageSize: query.pageSize,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one reflection candidate (owner only) — includes its sources and score explanation' })
  getOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<ReflectionCandidateDto> {
    return this.recordService.getOne(user.id, id);
  }

  @Post(':id/archive')
  @ApiOperation({ summary: 'Archive a reflection candidate (never resurrected by later regeneration)' })
  archive(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<ReflectionCandidateDto> {
    return this.recordService.archive(user.id, id);
  }

  @Post(':id/dismiss')
  @ApiOperation({ summary: 'Dismiss a reflection candidate (never resurrected by later regeneration)' })
  dismiss(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<ReflectionCandidateDto> {
    return this.recordService.dismiss(user.id, id);
  }
}
