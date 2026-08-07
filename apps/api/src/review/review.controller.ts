import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { ReviewRecordService, type ListReviewsResult } from './record/review-record.service';
import { ReviewExportService, type ReviewMarkdownExport } from './export/review-export.service';
import { ListReviewsQueryDto } from './dto/list-reviews.dto';
import { ReviewDetailQueryDto } from './dto/review-detail-query.dto';
import { CustomReviewQueryDto } from './dto/custom-review-query.dto';
import type { ReviewSummaryDto } from './review.mappers';

/**
 * Phases 5/6/7/8 API. `GET /reviews/custom` is registered before `GET /reviews/:id` for the same
 * route-ordering reason every other controller in this codebase documents (a literal single-
 * segment path must win over a same-shape `:id` param route). Every route sits behind
 * `JwtAuthGuard` + the project-wide `CsrfGuard`; every underlying query is `userId`-scoped.
 */
@ApiTags('reviews')
@Controller('reviews')
@UseGuards(JwtAuthGuard)
export class ReviewController {
  constructor(
    private readonly records: ReviewRecordService,
    private readonly exportService: ReviewExportService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List/filter the caller’s own reviews, paginated' })
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: ListReviewsQueryDto): Promise<ListReviewsResult> {
    return this.records.list(user.id, query);
  }

  @Get('custom')
  @ApiOperation({ summary: 'Generate (or return the already-materialized) custom-range review for the given from/to' })
  custom(@CurrentUser() user: AuthenticatedUser, @Query() query: CustomReviewQueryDto): Promise<ReviewSummaryDto> {
    return this.records.ensureCustom(user.id, query.from, query.to);
  }

  @Get('current/:window')
  @ApiOperation({ summary: 'Generate (or return the already-materialized) current week/month review' })
  current(@CurrentUser() user: AuthenticatedUser, @Param('window') window: 'week' | 'month'): Promise<ReviewSummaryDto> {
    return this.records.ensureCurrent(user.id, window.toUpperCase() as 'WEEK' | 'MONTH');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one review by id (owner only) — supports category/priorityTier evidence filters' })
  getOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Query() query: ReviewDetailQueryDto): Promise<ReviewSummaryDto> {
    return this.records.getOne(user.id, id, query);
  }

  @Post(':id/archive')
  @ApiOperation({ summary: 'Archive a review (never resurrected by later regeneration)' })
  archive(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<ReviewSummaryDto> {
    return this.records.archive(user.id, id);
  }

  @Get(':id/export/markdown')
  @ApiOperation({ summary: 'Export a review as Markdown — the frontend downloads the returned content as a .md file' })
  exportMarkdown(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<ReviewMarkdownExport> {
    return this.exportService.exportAsMarkdown(user.id, id);
  }

  @Get(':id/export/json')
  @ApiOperation({ summary: 'Export a review as JSON' })
  exportJson(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<ReviewSummaryDto> {
    return this.exportService.exportAsJson(user.id, id);
  }
}
