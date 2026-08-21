import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { DiscoveryThrottlerGuard } from '../common/guards/discovery-throttler.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { TuViRecordService, type ListTuViChartsResult } from './record/tu-vi-record.service';
import { CalculateTuViChartDto } from './dto/calculate-tu-vi-chart.dto';
import { ListTuViChartsQueryDto } from './dto/list-tu-vi-charts.dto';
import type { TuViChartDto, TuViChartHistoryDto } from './tu-vi.mappers';

/**
 * Sprint 18B.9/18B.10 — API. Every route sits behind `JwtAuthGuard` + the project-wide `CsrfGuard`;
 * every chart query is `userId`-scoped (mirrors `EasternHoroscopeController` exactly).
 */
@ApiTags('tu-vi')
@Controller('tu-vi')
@UseGuards(JwtAuthGuard)
export class TuViController {
  constructor(private readonly records: TuViRecordService) {}

  @Post('calculate')
  @ApiOperation({ summary: 'Calculate a new Tử Vi chart from a birth date, time, and sex' })
  calculate(@CurrentUser() user: AuthenticatedUser, @Body() dto: CalculateTuViChartDto): Promise<TuViChartDto> {
    return this.records.calculate(user.id, dto);
  }

  @Get('charts')
  @ApiOperation({ summary: "List/paginate the caller's own charts" })
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: ListTuViChartsQueryDto): Promise<ListTuViChartsResult> {
    return this.records.list(user.id, query);
  }

  @Get('charts/:id')
  @ApiOperation({ summary: 'Get one chart by id (owner only)' })
  getOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<TuViChartDto> {
    return this.records.getOne(user.id, id);
  }

  @Get('charts/:id/history')
  @ApiOperation({ summary: "Get a chart's lifecycle history" })
  history(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<TuViChartHistoryDto[]> {
    return this.records.history(user.id, id);
  }

  @Post('charts/:id/interpret')
  @UseGuards(DiscoveryThrottlerGuard)
  @SkipThrottle({ auth: true, companion: true, 'companion-ip': true, payment: true })
  @ApiOperation({ summary: 'Retry/regenerate AI interpretation (only needed if the first attempt failed — a chart already has at most one permanent interpretation)' })
  retryInterpretation(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<TuViChartDto> {
    return this.records.retryInterpretation(user.id, id);
  }

  @Post('charts/:id/archive')
  @ApiOperation({ summary: 'Archive a chart (reversible via restore)' })
  archive(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<TuViChartDto> {
    return this.records.archive(user.id, id);
  }

  @Post('charts/:id/restore')
  @ApiOperation({ summary: 'Restore an archived or deleted chart' })
  restore(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<TuViChartDto> {
    return this.records.restore(user.id, id);
  }

  @Delete('charts/:id')
  @ApiOperation({ summary: 'Soft-delete a chart (reversible via restore)' })
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<TuViChartDto> {
    return this.records.remove(user.id, id);
  }
}
