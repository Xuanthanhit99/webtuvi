import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JournalRecordService } from '../../journal/record/journal-record.service';
import type { JournalEntryDto } from '../../journal/journal.mappers';
import { detectJournalSuggestion, excerptFor } from './journal-suggestion-detector';

export interface JournalSuggestionResult {
  excerpt: string;
  reason: string;
}

/**
 * Wraps the deterministic detector with the "Never suggest again" preference check — mirrors
 * `MemorySuggestionService` exactly. Never creates a journal entry itself from `evaluate()`; the
 * only path that ever creates one is `saveFromSuggestion()`, and only after the user has clicked
 * "Save as Journal" — see docs/architecture/journal-foundation.md "Companion integration".
 */
@Injectable()
export class CompanionJournalService {
  private readonly logger = new Logger('CompanionJournal');

  constructor(
    private readonly prisma: PrismaService,
    private readonly journalRecord: JournalRecordService,
  ) {}

  async evaluate(userId: string, messageContent: string): Promise<JournalSuggestionResult | null> {
    const detected = detectJournalSuggestion(messageContent);
    if (!detected) return null;

    const preference = await this.prisma.userPreference.findUnique({ where: { userId } });
    if (preference && !preference.journalSuggestionsEnabled) return null;

    this.logger.log('Journal suggestion generated');
    return { excerpt: excerptFor(messageContent), reason: detected.reason };
  }

  /**
   * The one and only path a Companion suggestion can turn into a real journal entry — and even
   * this only creates a DRAFT, never a published entry (see JournalRecordService.create()'s own
   * default). Ownership of the source conversation/message is verified here, independently, the
   * same way MemoryCandidateService.propose() verifies it — never trusted from the client. The
   * created entry's title/content is the user's own already-sent message, verbatim; nothing is
   * generated.
   */
  async saveFromSuggestion(userId: string, conversationId: string, messageId: string): Promise<JournalEntryDto> {
    const conversation = await this.prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conversation || conversation.userId !== userId) {
      throw new NotFoundException({ code: 'CONVERSATION_NOT_FOUND', message: 'That conversation was not found.' });
    }

    const message = await this.prisma.conversationMessage.findUnique({ where: { id: messageId } });
    if (!message || message.conversationId !== conversationId) {
      throw new NotFoundException({ code: 'SOURCE_MESSAGE_NOT_FOUND', message: 'That message was not found in this conversation.' });
    }
    if (message.role !== 'USER') {
      throw new BadRequestException({
        code: 'SOURCE_NOT_USER_AUTHORED',
        message: 'A journal entry can only be saved from something you said, not an assistant reply.',
      });
    }

    const entry = await this.journalRecord.create(
      userId,
      { title: deriveTitleFrom(message.content), content: message.content },
      { sourceType: 'COMPANION_SUGGESTED', sourceConversationId: conversationId, sourceMessageId: messageId },
    );
    this.logger.log(`Journal draft created from Companion suggestion id=${entry.id}`);
    return entry;
  }

  /** "Never suggest again" — a single account-wide toggle, not a per-suggestion dismissal (that's
   * "Later," which is purely client-side and calls no endpoint at all — nothing to persist for a
   * one-time dismissal that has no lasting effect). */
  async neverAgain(userId: string): Promise<void> {
    await this.prisma.userPreference.upsert({
      where: { userId },
      update: { journalSuggestionsEnabled: false },
      create: { userId, journalSuggestionsEnabled: false },
    });
    this.logger.log('Journal suggestions disabled');
  }
}

const MAX_TITLE_LENGTH = 60;

function deriveTitleFrom(content: string): string {
  const trimmed = content.trim();
  return trimmed.length <= MAX_TITLE_LENGTH ? trimmed : `${trimmed.slice(0, MAX_TITLE_LENGTH)}…`;
}
