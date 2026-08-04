import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CompanionJournalService } from './companion-journal.service';
import type { JournalRecordService } from '../../journal/record/journal-record.service';

function makePrismaMock(opts: {
  preference?: { journalSuggestionsEnabled: boolean } | null;
  conversation?: { id: string; userId: string } | null;
  message?: { id: string; conversationId: string; role: string; content: string } | null;
} = {}) {
  return {
    userPreference: {
      findUnique: jest.fn(async () => opts.preference ?? null),
      upsert: jest.fn(async ({ create }: { create: unknown }) => create),
    },
    conversation: {
      findUnique: jest.fn(async () => opts.conversation ?? null),
    },
    conversationMessage: {
      findUnique: jest.fn(async () => opts.message ?? null),
    },
  };
}

function makeJournalRecordMock() {
  return { create: jest.fn(async () => ({ id: 'j-1', state: 'DRAFT' })) } as unknown as JournalRecordService;
}

describe('CompanionJournalService.evaluate', () => {
  it('returns null when the message does not match the detector', async () => {
    const prisma = makePrismaMock();
    const service = new CompanionJournalService(prisma as never, makeJournalRecordMock());
    expect(await service.evaluate('user-1', 'grocery list please')).toBeNull();
  });

  it('returns a suggestion for reflective content when no preference row exists yet (default enabled)', async () => {
    const prisma = makePrismaMock({ preference: null });
    const service = new CompanionJournalService(prisma as never, makeJournalRecordMock());
    const result = await service.evaluate('user-1', 'Today was such an emotional day, I want to remember this.');
    expect(result).not.toBeNull();
    expect(result!.excerpt.length).toBeGreaterThan(0);
  });

  it('respects "Never suggest again" — returns null once disabled, regardless of content', async () => {
    const prisma = makePrismaMock({ preference: { journalSuggestionsEnabled: false } });
    const service = new CompanionJournalService(prisma as never, makeJournalRecordMock());
    const result = await service.evaluate('user-1', 'Today was such an emotional day, I want to remember this.');
    expect(result).toBeNull();
  });
});

describe('CompanionJournalService.saveFromSuggestion', () => {
  it('rejects a conversation the caller does not own', async () => {
    const prisma = makePrismaMock({ conversation: { id: 'conv-1', userId: 'someone-else' } });
    const service = new CompanionJournalService(prisma as never, makeJournalRecordMock());
    await expect(service.saveFromSuggestion('user-1', 'conv-1', 'msg-1')).rejects.toThrow(NotFoundException);
  });

  it('rejects a message that does not belong to the given conversation', async () => {
    const prisma = makePrismaMock({
      conversation: { id: 'conv-1', userId: 'user-1' },
      message: { id: 'msg-1', conversationId: 'other-conv', role: 'USER', content: 'x' },
    });
    const service = new CompanionJournalService(prisma as never, makeJournalRecordMock());
    await expect(service.saveFromSuggestion('user-1', 'conv-1', 'msg-1')).rejects.toThrow(NotFoundException);
  });

  it('rejects an assistant-authored message as a source — never lets Companion author its own journal source', async () => {
    const prisma = makePrismaMock({
      conversation: { id: 'conv-1', userId: 'user-1' },
      message: { id: 'msg-1', conversationId: 'conv-1', role: 'ASSISTANT', content: 'A reply' },
    });
    const service = new CompanionJournalService(prisma as never, makeJournalRecordMock());
    await expect(service.saveFromSuggestion('user-1', 'conv-1', 'msg-1')).rejects.toThrow(BadRequestException);
  });

  it('creates a draft from a real, owned, USER-authored message, carrying the source fields', async () => {
    const prisma = makePrismaMock({
      conversation: { id: 'conv-1', userId: 'user-1' },
      message: { id: 'msg-1', conversationId: 'conv-1', role: 'USER', content: 'Today was a really reflective day for me.' },
    });
    const journalRecord = makeJournalRecordMock();
    const service = new CompanionJournalService(prisma as never, journalRecord);

    await service.saveFromSuggestion('user-1', 'conv-1', 'msg-1');

    expect(journalRecord.create).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ content: 'Today was a really reflective day for me.' }),
      { sourceType: 'COMPANION_SUGGESTED', sourceConversationId: 'conv-1', sourceMessageId: 'msg-1' },
    );
  });
});

describe('CompanionJournalService.neverAgain', () => {
  it('disables journal suggestions for the caller', async () => {
    const prisma = makePrismaMock();
    const service = new CompanionJournalService(prisma as never, makeJournalRecordMock());

    await service.neverAgain('user-1');

    expect(prisma.userPreference.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user-1' },
        update: { journalSuggestionsEnabled: false },
      }),
    );
  });
});
