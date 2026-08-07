import { PromptBuilderService, type HistoryTurn } from './prompt-builder.service';
import type { ConversationContext } from '../context/context.types';

function context(overrides: Partial<ConversationContext> = {}): ConversationContext {
  return {
    displayName: 'Alex',
    timezone: 'America/New_York',
    locale: 'en-US',
    pronouns: null,
    onboardingCompleted: true,
    memoryPreference: 'ASK_BEFORE_SAVING',
    reflectionFrequency: 'NOT_SURE_YET',
    recentActivityLabels: [],
    recentConversationSummaries: [],
    activeGoalTitles: [],
    latestTarotReading: null,
    currentTimeIso: '2026-01-01T12:00:00.000Z',
    currentTimeLabel: 'Thursday, 12:00 PM',
    ...overrides,
  };
}

describe('PromptBuilderService', () => {
  let builder: PromptBuilderService;

  beforeEach(() => {
    builder = new PromptBuilderService();
  });

  it('puts a system message first, containing the user\'s name and the hard safety rules', () => {
    const messages = builder.build(context(), [], 'Hello');
    expect(messages[0]!.role).toBe('system');
    expect(messages[0]!.content).toContain('Alex');
    expect(messages[0]!.content).toContain('Never diagnose');
    expect(messages[0]!.content).toContain('Never fabricate memories');
    expect(messages[0]!.content).toContain('Never claim to be a therapist');
  });

  it('appends conversation history in order, then the new user message last', () => {
    const history = [
      { role: 'user' as const, content: 'First message' },
      { role: 'assistant' as const, content: 'First reply' },
    ];
    const messages = builder.build(context(), history, 'Second message');

    expect(messages).toHaveLength(4); // system + 2 history + new user message
    expect(messages[1]).toEqual({ role: 'user', content: 'First message' });
    expect(messages[2]).toEqual({ role: 'assistant', content: 'First reply' });
    expect(messages[messages.length - 1]).toEqual({ role: 'user', content: 'Second message' });
  });

  it('caps history length so very long conversations do not grow the prompt unbounded', () => {
    const longHistory: HistoryTurn[] = Array.from({ length: 50 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `Turn ${i}`,
    }));
    const messages = builder.build(context(), longHistory, 'Latest');

    // system + at most MAX_HISTORY_TURNS + new user message
    expect(messages.length).toBeLessThan(longHistory.length + 2);
    expect(messages[messages.length - 1]).toEqual({ role: 'user', content: 'Latest' });
  });

  it('never claims shared history when there is none', () => {
    const messages = builder.build(context({ recentConversationSummaries: [] }), [], 'Hi');
    expect(messages[0]!.content).toMatch(/do not claim shared history/i);
  });

  it('includes other recent conversation excerpts when present, for continuity', () => {
    const messages = builder.build(
      context({
        recentConversationSummaries: [
          { title: 'New job', lastMessageExcerpt: 'starting next week', updatedAt: '2026-01-01T00:00:00.000Z' },
        ],
      }),
      [],
      'Hi',
    );
    expect(messages[0]!.content).toContain('starting next week');
  });

  it('reflects the memory preference so the model does not push against it', () => {
    const messages = builder.build(context({ memoryPreference: 'DO_NOT_SAVE_YET' }), [], 'Hi');
    expect(messages[0]!.content).toContain('DO_NOT_SAVE_YET');
  });

  // --- Sprint 3C: retrieved-memory block ---

  it('sends exactly the same prompt shape as before this sprint when no memory block is given', () => {
    const withoutArg = builder.build(context(), [], 'Hi');
    const withNull = builder.build(context(), [], 'Hi', null);
    expect(withoutArg).toEqual(withNull);
  });

  it('appends the memory block to the single system message — never as a separate message', () => {
    const messages = builder.build(context(), [], 'Hi', '- [GOAL] Learn Japanese: "Working toward JLPT N3."');
    expect(messages).toHaveLength(2); // system + user only, no extra message
    expect(messages[0]!.role).toBe('system');
    expect(messages[0]!.content).toContain('Learn Japanese');
  });

  it('places the memory block after the base system prompt content', () => {
    const messages = builder.build(context(), [], 'Hi', 'MEMORY_BLOCK_MARKER');
    const content = messages[0]!.content;
    expect(content.indexOf('Never fabricate memories')).toBeLessThan(content.indexOf('MEMORY_BLOCK_MARKER'));
  });
});
