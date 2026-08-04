import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CompanionJournalService } from './companion-journal.service';
import { SaveSuggestionDto } from './dto/save-suggestion.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import type { JournalEntryDto } from '../../journal/journal.mappers';

/**
 * Every mutation here maps to `JournalRecordService`'s own create path or a single user
 * preference toggle — this controller adds no new way for a journal entry to be created; it only
 * adds an explicit, confirmation-gated entry point into the one that already exists. See
 * docs/architecture/journal-foundation.md "Companion integration".
 */
@ApiTags('companion-journal')
@Controller('companion/journal-suggestions')
@UseGuards(JwtAuthGuard)
export class CompanionJournalController {
  constructor(private readonly companionJournal: CompanionJournalService) {}

  @Post('save')
  @ApiOperation({ summary: '"Save as Journal" — creates a real DRAFT from the source message, requires a further explicit Publish before it is a finished entry' })
  save(@CurrentUser() user: AuthenticatedUser, @Body() dto: SaveSuggestionDto): Promise<JournalEntryDto> {
    return this.companionJournal.saveFromSuggestion(user.id, dto.conversationId, dto.messageId);
  }

  @Post('never-again')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '"Never suggest again" — disables future journal suggestions for this account' })
  async neverAgain(@CurrentUser() user: AuthenticatedUser): Promise<void> {
    await this.companionJournal.neverAgain(user.id);
  }
}
