import { buildSystemPrompt } from './system-prompt';
import type { ConversationContext } from '../context/context.types';

function baseContext(overrides: Partial<ConversationContext> = {}): ConversationContext {
  return {
    displayName: 'An',
    pronouns: null,
    timezone: null,
    locale: null,
    currentTimeIso: '2026-09-17T10:00:00.000Z',
    currentTimeLabel: '10:00 AM',
    onboardingCompleted: true,
    recentActivityLabels: [],
    recentConversationSummaries: [],
    memoryPreference: 'BALANCED',
    reflectionFrequency: 'WEEKLY',
    activeGoalTitles: [],
    latestTarotReading: null,
    latestNumerologyReading: null,
    latestNatalChart: null,
    ...overrides,
  } as ConversationContext;
}

describe('buildSystemPrompt — Vietnamese language contract', () => {
  it('instructs the Companion to reply in Vietnamese by default', () => {
    const prompt = buildSystemPrompt(baseContext());
    expect(prompt).toMatch(/reply in natural, conversational Vietnamese by default/i);
  });

  it('self-identifies with the current brand', () => {
    const prompt = buildSystemPrompt(baseContext());
    expect(prompt).toMatch(/You are Mệnh Vi's Companion/);
  });
});
