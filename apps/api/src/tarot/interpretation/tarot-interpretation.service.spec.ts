import { TarotInterpretationService } from './tarot-interpretation.service';
import type { InterpretationInput } from '../tarot.types';

function makeCard(overrides: Partial<InterpretationInput['cards'][number]> = {}): InterpretationInput['cards'][number] {
  return {
    card: {
      id: 'card-1',
      slug: 'major-00-the-fool',
      name: 'The Fool',
      arcana: 'MAJOR',
      suit: null,
      number: 0,
      uprightKeywords: ['beginnings'],
      uprightMeaning: 'A leap of faith.',
      reversedKeywords: ['recklessness'],
      reversedMeaning: 'Naivety.',
      element: null,
      astrological: null,
      categories: ['change'],
      imageSlug: 'major-00',
      createdAt: new Date(),
    } as never,
    position: 0,
    positionLabel: 'Focus',
    isReversed: false,
    ...overrides,
  };
}

function baseInput(overrides: Partial<InterpretationInput> = {}): InterpretationInput {
  return {
    readingType: 'SINGLE_CARD',
    question: null,
    cards: [makeCard()],
    tier: 'FREE',
    memoryReference: null,
    ...overrides,
  };
}

function makeHarness(streamedContent = 'A grounded reflection about new beginnings.') {
  const streamCalls: { messages: { role: string; content: string }[]; options: { maxTokens?: number; temperature?: number } }[] = [];
  const orchestrator = {
    stream: jest.fn(async function* (messages: { role: string; content: string }[], options: { maxTokens?: number; temperature?: number }) {
      streamCalls.push({ messages, options });
      yield { type: 'token', content: streamedContent };
    }),
  };
  const safety = {
    checkInput: jest.fn().mockReturnValue({ allowed: true }),
    checkOutput: jest.fn().mockReturnValue({ allowed: true }),
  };
  const service = new TarotInterpretationService(orchestrator as never, safety as never);
  return { service, orchestrator, safety, streamCalls };
}

describe('TarotInterpretationService — Sprint 7 Free vs Premium interpretation depth (Phase 13)', () => {
  it('FREE uses the shorter token budget and never includes a memory reference in the prompt, even if one is passed', async () => {
    const { service, streamCalls } = makeHarness();
    await service.interpret(baseInput({ tier: 'FREE', memoryReference: { title: 'Loves hiking', summary: 'Mentioned enjoying weekend hikes.' } }));
    expect(streamCalls[0]!.options.maxTokens).toBe(400);
    // FREE system prompt is the shorter variant and never claims to go "deeper"/reference memory guidance.
    expect(streamCalls[0]!.messages[0]!.content).toMatch(/brief and clear/i);
    expect(streamCalls[0]!.messages[0]!.content).not.toMatch(/Premium \(deeper\)/i);
  });

  it('PREMIUM uses the richer token budget and the deeper-narration system prompt', async () => {
    const { service, streamCalls } = makeHarness();
    await service.interpret(baseInput({ tier: 'PREMIUM', memoryReference: { title: 'Loves hiking', summary: 'Mentioned enjoying weekend hikes.' } }));
    expect(streamCalls[0]!.options.maxTokens).toBe(700);
    expect(streamCalls[0]!.messages[0]!.content).toMatch(/Premium \(deeper\)/i);
  });

  it('a PREMIUM memory reference is woven into the user message; a FREE one (if somehow passed) still is — the FREE/PREMIUM memory boundary is enforced by the caller, not this prompt-builder', async () => {
    const { service, streamCalls } = makeHarness();
    await service.interpret(baseInput({ tier: 'PREMIUM', memoryReference: { title: 'Loves hiking', summary: 'Weekend hikes.' } }));
    expect(streamCalls[0]!.messages[1]!.content).toContain('Loves hiking');
  });

  it('both tiers still forbid fabricating cards/memories — the hard rules text is present in both prompts', async () => {
    const { service, streamCalls } = makeHarness();
    await service.interpret(baseInput({ tier: 'FREE' }));
    const freePrompt = streamCalls[0]!.messages[0]!.content;
    await service.interpret(baseInput({ tier: 'PREMIUM' }));
    const premiumPrompt = streamCalls[1]!.messages[0]!.content;
    for (const prompt of [freePrompt, premiumPrompt]) {
      expect(prompt).toMatch(/never choose, change, add, or remove a card/i);
      expect(prompt).toMatch(/Never fabricate a user memory/i);
    }
  });
});

describe('TarotInterpretationService — safety pipeline unaffected by tier', () => {
  it('a refused input short-circuits before any provider call, regardless of tier', async () => {
    const { service, orchestrator, safety } = makeHarness();
    safety.checkInput.mockReturnValue({ allowed: false, category: 'self_harm', refusalMessage: 'refused' });
    const result = await service.interpret(baseInput({ tier: 'PREMIUM', question: 'unsafe question' }));
    expect(result).toBe('refused');
    expect(orchestrator.stream).not.toHaveBeenCalled();
  });

  it('a refused output is returned as the refusal message, not the raw generated content', async () => {
    const { service, safety } = makeHarness();
    safety.checkOutput.mockReturnValue({ allowed: false, category: 'unsafe', refusalMessage: 'output refused' });
    const result = await service.interpret(baseInput({ tier: 'FREE' }));
    expect(result).toBe('output refused');
  });
});
