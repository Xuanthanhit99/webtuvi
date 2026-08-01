import { NotFoundException } from '@nestjs/common';
import { ContextBuilderService } from './context-builder.service';

function makePrismaMock(user: unknown, conversations: unknown[] = []) {
  return {
    user: { findUnique: jest.fn().mockResolvedValue(user) },
    conversation: { findMany: jest.fn().mockResolvedValue(conversations) },
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
});
