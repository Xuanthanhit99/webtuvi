import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { DiscoveryThrottlerGuard } from '../common/guards/discovery-throttler.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { listNumerologyMeanings, type NumerologyMeaning } from './engine/numerology-meanings';
import { NumerologyRecordService, type ListReadingsResult } from './record/numerology-record.service';
import { CalculateNumerologyDto } from './dto/calculate-numerology.dto';
import { ListReadingsQueryDto } from './dto/list-readings.dto';
import type { NumerologyReadingDto, NumerologyReadingHistoryDto } from './numerology.mappers';

/**
 * Phase 10 — API. Every route sits behind `JwtAuthGuard` + the project-wide `CsrfGuard`; every
 * reading query is `userId`-scoped. `meanings` is read-only reference data (not user-owned) but
 * still auth-gated for consistency with the rest of this app (mirrors `TarotController`'s own
 * `deck` routes). Calculation itself keeps its DB-count-level daily ceiling
 * (`NumerologyRecordService.assertWithinDailyLimit`) — read/lifecycle routes still carry no
 * throttler.
 *
 * Sprint 12 — `retryInterpretation` (the confirmed AI-cost abuse vector, audit §30) now carries
 * `DiscoveryThrottlerGuard`, the same shared Discovery rate-limit bucket Tarot/Natal Chart use.
 */
@ApiTags('numerology')
@Controller('numerology')
@UseGuards(JwtAuthGuard)
export class NumerologyController {
  constructor(private readonly records: NumerologyRecordService) {}

  @Get('meanings')
  @ApiOperation({ summary: 'List the full static, deterministic traditional-meaning reference table for every (type, value) pair' })
  listMeanings(): NumerologyMeaning[] {
    return listNumerologyMeanings();
  }

  @Post('calculate')
  @ApiOperation({ summary: 'Calculate a new Numerology reading from a full birth name and birth date, and generate its interpretation' })
  calculate(@CurrentUser() user: AuthenticatedUser, @Body() dto: CalculateNumerologyDto): Promise<NumerologyReadingDto> {
    return this.records.calculate(user.id, dto);
  }

  @Get('readings')
  @ApiOperation({ summary: 'List/paginate the caller’s own readings' })
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: ListReadingsQueryDto): Promise<ListReadingsResult> {
    return this.records.list(user.id, query);
  }

  @Get('readings/:id')
  @ApiOperation({ summary: 'Get one reading by id (owner only)' })
  getOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<NumerologyReadingDto> {
    return this.records.getOne(user.id, id);
  }

  @Get('readings/:id/history')
  @ApiOperation({ summary: 'Get a reading’s lifecycle history' })
  history(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<NumerologyReadingHistoryDto[]> {
    return this.records.history(user.id, id);
  }

  @Post('readings/:id/interpret')
  @UseGuards(DiscoveryThrottlerGuard)
  @SkipThrottle({ auth: true, companion: true, 'companion-ip': true, payment: true })
  @ApiOperation({ summary: 'Retry AI interpretation for a reading whose interpretation is still null' })
  retryInterpretation(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<NumerologyReadingDto> {
    return this.records.retryInterpretation(user.id, id);
  }

  @Post('readings/:id/archive')
  @ApiOperation({ summary: 'Archive a reading (reversible via restore)' })
  archive(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<NumerologyReadingDto> {
    return this.records.archive(user.id, id);
  }

  @Post('readings/:id/restore')
  @ApiOperation({ summary: 'Restore an archived or deleted reading' })
  restore(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<NumerologyReadingDto> {
    return this.records.restore(user.id, id);
  }

  @Delete('readings/:id')
  @ApiOperation({ summary: 'Soft-delete a reading (reversible via restore)' })
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<NumerologyReadingDto> {
    return this.records.remove(user.id, id);
  }
}
