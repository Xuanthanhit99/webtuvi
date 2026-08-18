import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { DiscoveryThrottlerGuard } from '../common/guards/discovery-throttler.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { EasternHoroscopeRecordService, type ListProfilesResult } from './record/eastern-horoscope-record.service';
import { CalculateEasternHoroscopeDto } from './dto/calculate-eastern-horoscope.dto';
import { ListProfilesQueryDto } from './dto/list-profiles.dto';
import type { EasternHoroscopeProfileDto, EasternHoroscopeProfileHistoryDto } from './eastern-horoscope.mappers';

/**
 * Sprint 17 — API. Every route sits behind `JwtAuthGuard` + the project-wide `CsrfGuard`; every
 * profile query is `userId`-scoped (mirrors `NumerologyController` exactly). Calculation keeps its
 * DB-count-level daily ceiling (`EasternHoroscopeRecordService.assertWithinDailyLimit`) —
 * read/lifecycle routes carry no throttler. `retryInterpretation` carries `DiscoveryThrottlerGuard`,
 * the same shared Discovery rate-limit bucket every other Discovery system uses.
 */
@ApiTags('eastern-horoscope')
@Controller('eastern-horoscope')
@UseGuards(JwtAuthGuard)
export class EasternHoroscopeController {
  constructor(private readonly records: EasternHoroscopeRecordService) {}

  @Post('calculate')
  @ApiOperation({ summary: 'Calculate a new Eastern Horoscope profile from a birth date, and generate its interpretation' })
  calculate(@CurrentUser() user: AuthenticatedUser, @Body() dto: CalculateEasternHoroscopeDto): Promise<EasternHoroscopeProfileDto> {
    return this.records.calculate(user.id, dto);
  }

  @Get('profiles')
  @ApiOperation({ summary: 'List/paginate the caller’s own profiles' })
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: ListProfilesQueryDto): Promise<ListProfilesResult> {
    return this.records.list(user.id, query);
  }

  @Get('profiles/:id')
  @ApiOperation({ summary: 'Get one profile by id (owner only)' })
  getOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<EasternHoroscopeProfileDto> {
    return this.records.getOne(user.id, id);
  }

  @Get('profiles/:id/history')
  @ApiOperation({ summary: 'Get a profile’s lifecycle history' })
  history(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<EasternHoroscopeProfileHistoryDto[]> {
    return this.records.history(user.id, id);
  }

  @Post('profiles/:id/interpret')
  @UseGuards(DiscoveryThrottlerGuard)
  @SkipThrottle({ auth: true, companion: true, 'companion-ip': true, payment: true })
  @ApiOperation({ summary: 'Retry/regenerate AI interpretation for the current calendar year (also used when the existing interpretation has gone stale)' })
  retryInterpretation(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<EasternHoroscopeProfileDto> {
    return this.records.retryInterpretation(user.id, id);
  }

  @Post('profiles/:id/archive')
  @ApiOperation({ summary: 'Archive a profile (reversible via restore)' })
  archive(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<EasternHoroscopeProfileDto> {
    return this.records.archive(user.id, id);
  }

  @Post('profiles/:id/restore')
  @ApiOperation({ summary: 'Restore an archived or deleted profile' })
  restore(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<EasternHoroscopeProfileDto> {
    return this.records.restore(user.id, id);
  }

  @Delete('profiles/:id')
  @ApiOperation({ summary: 'Soft-delete a profile (reversible via restore)' })
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<EasternHoroscopeProfileDto> {
    return this.records.remove(user.id, id);
  }
}
