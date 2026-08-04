import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JournalRecordService, type JournalRevisionDto, type ListJournalResult } from './journal-record.service';
import { JournalTimelineService, type TimelineResult } from '../timeline/journal-timeline.service';
import { JournalExportService, type JournalMarkdownExport } from '../export/journal-export.service';
import { CreateJournalDto } from './dto/create-journal.dto';
import { UpdateJournalDto } from './dto/update-journal.dto';
import { ListJournalQueryDto } from './dto/list-journal.dto';
import { TimelineQueryDto } from '../timeline/dto/timeline-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import type { JournalEntryDto } from '../journal.mappers';

@ApiTags('journal')
@Controller('journal')
@UseGuards(JwtAuthGuard)
export class JournalRecordController {
  constructor(
    private readonly recordService: JournalRecordService,
    private readonly timelineService: JournalTimelineService,
    private readonly exportService: JournalExportService,
  ) {}

  // Registered before ':id' — otherwise Nest would try to match "timeline" as an :id param
  // (same footgun documented in memory-record.controller.ts).
  @Get('timeline')
  @ApiOperation({ summary: 'Reverse-chronological, cursor-paginated, day/week/month-grouped timeline' })
  timeline(@CurrentUser() user: AuthenticatedUser, @Query() query: TimelineQueryDto): Promise<TimelineResult> {
    return this.timelineService.timeline(user.id, {
      groupBy: query.groupBy,
      includeArchived: query.includeArchived,
      cursor: query.cursor,
      limit: query.limit,
    });
  }

  @Post()
  @ApiOperation({ summary: 'Create a new journal entry — always starts as a DRAFT' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateJournalDto): Promise<JournalEntryDto> {
    return this.recordService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List/filter/search the caller’s own journal entries (Phase 2 List/Filter/Tag/Mood + Phase 6 Search, one endpoint)' })
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: ListJournalQueryDto): Promise<ListJournalResult> {
    return this.recordService.list(user.id, {
      q: query.q,
      state: query.state,
      mood: query.mood,
      tag: query.tag,
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
      sort: query.sort,
      pinned: query.pinned,
      page: query.page,
      pageSize: query.pageSize,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one journal entry (owner only)' })
  getOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<JournalEntryDto> {
    return this.recordService.getOne(user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Explicitly save changes to a journal entry — versions if title/content changed' })
  update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateJournalDto): Promise<JournalEntryDto> {
    return this.recordService.update(user.id, id, dto);
  }

  @Post(':id/autosave')
  @ApiOperation({ summary: 'Draft-only autosave tick — never versions, never allowed once published (see Draft System)' })
  autosave(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateJournalDto) {
    return this.recordService.autosave(user.id, id, dto);
  }

  @Post(':id/publish')
  @ApiOperation({ summary: 'Publish a draft — the only DRAFT -> PUBLISHED transition' })
  publish(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<JournalEntryDto> {
    return this.recordService.publish(user.id, id);
  }

  @Post(':id/archive')
  @ApiOperation({ summary: 'Archive an entry (reversible)' })
  archive(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<JournalEntryDto> {
    return this.recordService.archive(user.id, id);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore an archived or soft-deleted entry to its state beforehand' })
  restore(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<JournalEntryDto> {
    return this.recordService.restore(user.id, id);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate an entry into a brand-new draft' })
  duplicate(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<JournalEntryDto> {
    return this.recordService.duplicate(user.id, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete an entry (recoverable via restore — see docs/architecture/journal-foundation.md "Lifecycle")' })
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<JournalEntryDto> {
    return this.recordService.remove(user.id, id);
  }

  @Get(':id/revisions')
  @ApiOperation({ summary: 'Full revision history of an entry' })
  revisions(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<JournalRevisionDto[]> {
    return this.recordService.revisions(user.id, id);
  }

  @Get(':id/export/markdown')
  @ApiOperation({ summary: 'Export one entry as Markdown (with a small YAML front-matter header) — the frontend downloads the returned content as a .md file' })
  exportMarkdown(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<JournalMarkdownExport> {
    return this.exportService.exportEntryAsMarkdown(user.id, id);
  }

  @Get(':id/export/json')
  @ApiOperation({ summary: 'Export one entry as JSON' })
  exportJson(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<JournalEntryDto> {
    return this.exportService.exportEntryAsJson(user.id, id);
  }
}
