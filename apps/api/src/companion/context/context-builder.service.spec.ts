import { NotFoundException } from '@nestjs/common';
import { ContextBuilderService } from './context-builder.service';

function makePrismaMock(
  user: unknown,
  conversations: unknown[] = [],
  goals: unknown[] = [],
  latestTarotReading: unknown = null,
  latestNumerologyReading: unknown = null,
) {
  return {
    user: { findUnique: jest.fn().mockResolvedValue(user) },
    conversation: { findMany: jest.fn().mockResolvedValue(conversations) },
    goal: { findMany: jest.fn().mockResolvedValue(goals) },
    tarotReading: { findFirst: jest.fn().mockResolvedValue(latestTarotReading) },
    numerologyReading: { findFirst: jest.fn().mockResolvedValue(latestNumerologyReading) },
  };
}

describe('ContextBuilderService', () => {
  it('throws NotFoundException for an unknown user', async () => {
    const prisma = makePrismaMock(null);
    const activities = { recent: jest.fn().mockResolvedValue([]) };
    const builder = new ContextBuilderService(prisma as never, activities as never);

    await expect(builder.build('missing-user')).rejects.toThrow(NotFoundException);
  });

  it('maps profile/preference fields, defaulting sensibly when absent', async () => {
    const prisma = makePrismaMock({
      id: 'u1',
      displayName: 'Alex',
      onboardingCompletedAt: new Date('2026-01-01'),
      profile: null,
      preference: null,
    });
    const activities = { recent: jest.fn().mockResolvedValue([]) };
    const builder = new ContextBuilderService(prisma as never, activities as never);

    const context = await builder.build('u1');

    expect(context.displayName).toBe('Alex');
    expect(context.timezone).toBeNull();
    expect(context.onboardingCompleted).toBe(true);
    expect(context.memoryPreference).toBe('ASK_BEFORE_SAVING');
    expect(context.reflectionFrequency).toBe('NOT_SURE_YET');
  });

  it('includes recent activity labels and recent conversation excerpts, oldest-first ordering preserved from the query', async () => {
    const prisma = makePrismaMock(
      {
        id: 'u1',
        displayName: 'Alex',
        onboardingCompletedAt: null,
        profile: { timezone: 'UTC', locale: 'en', pronouns: 'she/her' },
        preference: { memoryPreference: 'SAVE_SELECTED_ONLY', reflectionFrequency: 'WEEKLY' },
      },
      [
        {
          title: 'New job',
          updatedAt: new Date('2026-01-02'),
          messages: [{ content: 'starting a new role soon' }],
        },
      ],
    );
    const activities = { recent: jest.fn().mockResolvedValue([{ label: 'Onboarding completed' }]) };
    const builder = new ContextBuilderService(prisma as never, activities as never);

    const context = await builder.build('u1', 'current-convo-id');

    expect(context.pronouns).toBe('she/her');
    expect(context.recentActivityLabels).toEqual(['Onboarding completed']);
    expect(context.recentConversationSummaries).toHaveLength(1);
    expect(context.recentConversationSummaries[0]!.lastMessageExcerpt).toContain('starting a new role soon');
    expect(prisma.conversation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ userId: 'u1', id: { not: 'current-convo-id' } }) }),
    );
  });

  it('excludes conversations with no messages from the summary list', async () => {
    const prisma = makePrismaMock(
      {
        id: 'u1',
        displayName: 'Alex',
        onboardingCompletedAt: null,
        profile: null,
        preference: null,
      },
      [{ title: 'Empty', updatedAt: new Date(), messages: [] }],
    );
    const activities = { recent: jest.fn().mockResolvedValue([]) };
    const builder = new ContextBuilderService(prisma as never, activities as never);

    const context = await builder.build('u1');
    expect(context.recentConversationSummaries).toHaveLength(0);
  });

  it('includes active, Companion-visible goal titles only, scoped to the caller', async () => {
    const prisma = makePrismaMock(
      { id: 'u1', displayName: 'Alex', onboardingCompletedAt: null, profile: null, preference: null },
      [],
      [{ title: 'Learn Spanish' }, { title: 'Read 12 books' }],
    );
    const activities = { recent: jest.fn().mockResolvedValue([]) };
    const builder = new ContextBuilderService(prisma as never, activities as never);

    const context = await builder.build('u1');

    expect(context.activeGoalTitles).toEqual(['Learn Spanish', 'Read 12 books']);
    expect(prisma.goal.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'u1', status: 'ACTIVE', visibility: 'COMPANION_VISIBLE' } }),
    );
  });

  it('includes the latest active, Companion-visible Tarot reading’s real cards and interpretation', async () => {
    const prisma = makePrismaMock(
      { id: 'u1', displayName: 'Alex', onboardingCompletedAt: null, profile: null, preference: null },
      [],
      [],
      {
        interpretation: 'A moment worth sitting with.',
        createdAt: new Date('2026-01-05T00:00:00.000Z'),
        cards: [{ isReversed: false, card: { name: 'The Star' } }, { isReversed: true, card: { name: 'Five of Cups' } }],
      },
    );
    const activities = { recent: jest.fn().mockResolvedValue([]) };
    const builder = new ContextBuilderService(prisma as never, activities as never);

    const context = await builder.build('u1');

    expect(context.latestTarotReading).toEqual({
      cardNames: ['The Star', 'Five of Cups (reversed)'],
      interpretation: 'A moment worth sitting with.',
      createdAt: '2026-01-05T00:00:00.000Z',
    });
    expect(prisma.tarotReading.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'u1', status: 'ACTIVE', visibility: 'COMPANION_VISIBLE' } }),
    );
  });

  it('latestTarotReading is null when no such reading exists', async () => {
    const prisma = makePrismaMock({ id: 'u1', displayName: 'Alex', onboardingCompletedAt: null, profile: null, preference: null });
    const activities = { recent: jest.fn().mockResolvedValue([]) };
    const builder = new ContextBuilderService(prisma as never, activities as never);

    const context = await builder.build('u1');

    expect(context.latestTarotReading).toBeNull();
  });

  it('includes the latest active, Companion-visible Numerology reading’s real values and interpretation', async () => {
    const prisma = makePrismaMock(
      { id: 'u1', displayName: 'Alex', onboardingCompletedAt: null, profile: null, preference: null },
      [],
      [],
      null,
      {
        interpretation: 'A grounded reflection.',
        createdAt: new Date('2026-01-06T00:00:00.000Z'),
        values: [{ type: 'LIFE_PATH', value: 22, isMasterNumber: true }],
      },
    );
    const activities = { recent: jest.fn().mockResolvedValue([]) };
    const builder = new ContextBuilderService(prisma as never, activities as never);

    const context = await builder.build('u1');

    expect(context.latestNumerologyReading).toEqual({
      values: [{ type: 'LIFE_PATH', value: 22, isMasterNumber: true }],
      interpretation: 'A grounded reflection.',
      createdAt: '2026-01-06T00:00:00.000Z',
    });
    expect(prisma.numerologyReading.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'u1', status: 'ACTIVE', visibility: 'COMPANION_VISIBLE' } }),
    );
  });

  it('latestNumerologyReading is null when no such reading exists', async () => {
    const prisma = makePrismaMock({ id: 'u1', displayName: 'Alex', onboardingCompletedAt: null, profile: null, preference: null });
    const activities = { recent: jest.fn().mockResolvedValue([]) };
    const builder = new ContextBuilderService(prisma as never, activities as never);

    const context = await builder.build('u1');

    expect(context.latestNumerologyReading).toBeNull();
  });
});
