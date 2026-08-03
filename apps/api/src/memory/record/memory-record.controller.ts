import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  MemoryRecordService,
  type ListMemoriesResult,
  type TimelineResult,
} from './memory-record.service';
import { ListMemoryQueryDto } from './dto/list-memory.dto';
import { UpdateMemoryDto } from './dto/update-memory.dto';
import { TimelineQueryDto } from './dto/timeline-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import type { MemoryDto } from '../memory.mappers';
import type { MemoryAuditEntryDto } from '../audit/memory-audit.service';

@ApiTags('memory')
@Controller('memory')
@UseGuards(JwtAuthGuard)
export class MemoryRecordController {
  constructor(private readonly recordService: MemoryRecordService) {}

  // Registered before ':id' — otherwise Nest would try to match "timeline" as an :id param.
  @Get('timeline')
  @ApiOperation({ summary: 'Reverse-chronological, cursor-paginated memory timeline' })
  timeline(@CurrentUser() user: AuthenticatedUser, @Query() query: TimelineQueryDto): Promise<TimelineResult> {
    return this.recordService.timeline(user.id, {
      type: query.type,
      status: query.status,
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
      cursor: query.cursor,
      limit: query.limit,
    });
  }

  @Get()
  @ApiOperation({ summary: 'List the caller’s memories, paginated, filterable by type/status/date range' })
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: ListMemoryQueryDto): Promise<ListMemoriesResult> {
    return this.recordService.list(user.id, {
      type: query.type,
      status: query.status,
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
      sort: query.sort,
      page: query.page,
      pageSize: query.pageSize,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one memory (owner only)' })
  getOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<MemoryDto> {
    return this.recordService.getOne(user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a memory’s title/visibility only — content is never directly editable, see docs' })
  update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateMemoryDto): Promise<MemoryDto> {
    return this.recordService.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Permanently delete a memory (idempotent — see deletion policy)' })
  async remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<void> {
    await this.recordService.remove(user.id, id);
  }

  @Post(':id/archive')
  @ApiOperation({ summary: 'Archive a memory (reversible — hides it from the default list, keeps it recoverable)' })
  archive(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<MemoryDto> {
    return this.recordService.archive(user.id, id);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore an archived memory' })
  restore(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<MemoryDto> {
    return this.recordService.restore(user.id, id);
  }

  @Get(':id/versions')
  @ApiOperation({ summary: 'Full version history of a memory' })
  versions(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.recordService.versions(user.id, id);
  }

  @Get(':id/audit')
  @ApiOperation({ summary: 'User-visible activity history for a memory (event trail only, never content)' })
  audit(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<MemoryAuditEntryDto[]> {
    return this.recordService.auditTrail(user.id, id);
  }
}
