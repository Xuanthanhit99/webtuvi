import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { DiscoveryThrottlerGuard } from '../common/guards/discovery-throttler.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { NatalChartRecordService, type ListNatalChartsResult } from './record/natal-chart-record.service';
import { CreateNatalChartDto } from './dto/create-natal-chart.dto';
import { ListNatalChartsQueryDto } from './dto/list-natal-charts.dto';
import type { NatalChartDto, NatalChartHistoryDto } from './natal-chart.mappers';

/**
 * Phase 9 — API. Every route sits behind `JwtAuthGuard` + the project-wide `CsrfGuard`; every
 * chart query is `userId`-scoped. Route shape mirrors `NumerologyController`'s own
 * `readings/:id/action` convention (plural `natal-charts` base, per the sprint brief's own
 * route sketch) rather than the Product Bible's illustrative (non-binding) `/natal-chart/...`
 * sketch, for consistency with the rest of this codebase's Discovery controllers.
 */
@ApiTags('natal-chart')
@Controller('natal-charts')
@UseGuards(JwtAuthGuard)
export class NatalChartController {
  constructor(private readonly records: NatalChartRecordService) {}

  @Post()
  @ApiOperation({ summary: 'Calculate a new Natal Chart from birth date/time and a resolved location token, and generate its interpretation' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateNatalChartDto): Promise<NatalChartDto> {
    return this.records.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List/paginate the caller’s own charts' })
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: ListNatalChartsQueryDto): Promise<ListNatalChartsResult> {
    return this.records.list(user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one chart by id (owner only)' })
  getOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<NatalChartDto> {
    return this.records.getOne(user.id, id);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Get a chart’s lifecycle history' })
  history(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<NatalChartHistoryDto[]> {
    return this.records.history(user.id, id);
  }

  @Post(':id/interpret')
  @UseGuards(DiscoveryThrottlerGuard)
  @SkipThrottle({ auth: true, companion: true, 'companion-ip': true, payment: true, admin: true })
  @ApiOperation({ summary: 'Retry AI interpretation for a chart whose interpretation is still null' })
  retryInterpretation(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<NatalChartDto> {
    return this.records.retryInterpretation(user.id, id);
  }

  @Post(':id/archive')
  @ApiOperation({ summary: 'Archive a chart (reversible via restore)' })
  archive(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<NatalChartDto> {
    return this.records.archive(user.id, id);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore an archived or deleted chart' })
  restore(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<NatalChartDto> {
    return this.records.restore(user.id, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete a chart (reversible via restore)' })
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<NatalChartDto> {
    return this.records.remove(user.id, id);
  }
}
