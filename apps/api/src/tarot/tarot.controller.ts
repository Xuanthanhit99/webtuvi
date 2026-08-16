import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { DiscoveryThrottlerGuard } from '../common/guards/discovery-throttler.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { TarotDeckService } from './deck/tarot-deck.service';
import { TarotRecordService, type ListReadingsResult } from './record/tarot-record.service';
import { DrawReadingDto } from './dto/draw-reading.dto';
import { ListReadingsQueryDto } from './dto/list-readings.dto';
import { ListDeckQueryDto } from './dto/list-deck.dto';
import type { TarotCardDto, TarotReadingDto, TarotReadingHistoryDto } from './tarot.mappers';

/**
 * Phase 5/9 API — Tarot Discovery Foundation. Every route sits behind `JwtAuthGuard` + the
 * project-wide `CsrfGuard`; every reading query is `userId`-scoped. The deck/spread routes are
 * read-only reference data (not user-owned) but still auth-gated for consistency with the rest
 * of this app.
 */
@ApiTags('tarot')
@Controller('tarot')
@UseGuards(JwtAuthGuard)
export class TarotController {
  constructor(
    private readonly deck: TarotDeckService,
    private readonly records: TarotRecordService,
  ) {}

  @Get('deck')
  @ApiOperation({ summary: 'List the 78-card deck, with optional arcana/suit/category/search filters' })
  listDeck(@Query() query: ListDeckQueryDto): Promise<TarotCardDto[]> {
    return this.deck.list(query);
  }

  @Get('deck/:slug')
  @ApiOperation({ summary: 'Get one card by slug' })
  getCard(@Param('slug') slug: string): Promise<TarotCardDto> {
    return this.deck.getBySlug(slug);
  }

  @Post('draw')
  @ApiOperation({ summary: 'Draw a new reading (Daily Draw, Single Card, or Three Card Spread) and generate its interpretation' })
  draw(@CurrentUser() user: AuthenticatedUser, @Body() dto: DrawReadingDto): Promise<TarotReadingDto> {
    return this.records.draw(user.id, dto);
  }

  @Get('readings')
  @ApiOperation({ summary: 'List/search the caller’s own readings, paginated' })
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: ListReadingsQueryDto): Promise<ListReadingsResult> {
    return this.records.list(user.id, query);
  }

  @Get('readings/:id')
  @ApiOperation({ summary: 'Get one reading by id (owner only)' })
  getOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<TarotReadingDto> {
    return this.records.getOne(user.id, id);
  }

  @Get('readings/:id/history')
  @ApiOperation({ summary: 'Get a reading’s lifecycle history' })
  history(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<TarotReadingHistoryDto[]> {
    return this.records.history(user.id, id);
  }

  @Post('readings/:id/interpret')
  @UseGuards(DiscoveryThrottlerGuard)
  @SkipThrottle({ auth: true, companion: true, 'companion-ip': true, payment: true })
  @ApiOperation({ summary: 'Retry AI interpretation for a reading whose interpretation is still null' })
  retryInterpretation(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<TarotReadingDto> {
    return this.records.retryInterpretation(user.id, id);
  }

  @Post('readings/:id/archive')
  @ApiOperation({ summary: 'Archive a reading (reversible via restore)' })
  archive(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<TarotReadingDto> {
    return this.records.archive(user.id, id);
  }

  @Post('readings/:id/restore')
  @ApiOperation({ summary: 'Restore an archived or deleted reading' })
  restore(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<TarotReadingDto> {
    return this.records.restore(user.id, id);
  }

  @Delete('readings/:id')
  @ApiOperation({ summary: 'Soft-delete a reading (reversible via restore)' })
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<TarotReadingDto> {
    return this.records.remove(user.id, id);
  }
}
