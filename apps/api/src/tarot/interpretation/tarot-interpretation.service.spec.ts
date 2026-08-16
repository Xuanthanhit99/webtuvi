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

function makeHarness(streamedContent = 'A grounded reflection about new beginnings.', options: { withDoneChunk?: boolean } = {}) {
  const withDoneChunk = options.withDoneChunk ?? true;
  const streamCalls: {
    messages: { role: string; content: string }[];
    chatOptions: { maxTokens?: number; temperature?: number };
    attribution?: { feature: string; sourceId?: string };
  }[] = [];
  const orchestrator = {
    stream: jest.fn(async function* (
      messages: { role: string; content: string }[],
      chatOptions: { maxTokens?: number; temperature?: number },
      attribution?: { feature: string; sourceId?: string },
    ) {
      streamCalls.push({ messages, chatOptions, attribution });
      yield { type: 'token', content: streamedContent };
      if (withDoneChunk) {
        yield {
          type: 'done',
          usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
          model: 'mock-model',
          provider: 'mock',
        };
      }
    }),
  };
  const safety = {
    checkInput: jest.fn().mockReturnValue({ allowed: true }),
    checkOutput: jest.fn().mockReturnValue({ allowed: true }),
  };
  const costControl = { record: jest.fn().mockResolvedValue(0.001234) };
  const observability = { logUsage: jest.fn() };
  const service = new TarotInterpretationService(orchestrator as never, safety as never, costControl as never, observability as never);
  const attribution = { userId: 'user-1', sourceId: 'reading-1' };
  return { service, orchestrator, safety, costControl, observability, streamCalls, attribution };
}

describe('TarotInterpretationService — Sprint 7 Free vs Premium interpretation depth (Phase 13)', () => {
  it('FREE uses the shorter token budget and never includes a memory reference in the prompt, even if one is passed', async () => {
    const { service, streamCalls, attribution } = makeHarness();
    await service.interpret(baseInput({ tier: 'FREE', memoryReference: { title: 'Loves hiking', summary: 'Mentioned enjoying weekend hikes.' } }), attribution);
    expect(streamCalls[0]!.chatOptions.maxTokens).toBe(400);
    // FREE system prompt is the shorter variant and never claims to go "deeper"/reference memory guidance.
    expect(streamCalls[0]!.messages[0]!.content).toMatch(/brief and clear/i);
    expect(streamCalls[0]!.messages[0]!.content).not.toMatch(/Premium \(deeper\)/i);
  });

  it('PREMIUM uses the richer token budget and the deeper-narration system prompt', async () => {
    const { service, streamCalls, attribution } = makeHarness();
    await service.interpret(baseInput({ tier: 'PREMIUM', memoryReference: { title: 'Loves hiking', summary: 'Mentioned enjoying weekend hikes.' } }), attribution);
    expect(streamCalls[0]!.chatOptions.maxTokens).toBe(700);
    expect(streamCalls[0]!.messages[0]!.content).toMatch(/Premium \(deeper\)/i);
  });

  it('a PREMIUM memory reference is woven into the user message; a FREE one (if somehow passed) still is — the FREE/PREMIUM memory boundary is enforced by the caller, not this prompt-builder', async () => {
    const { service, streamCalls, attribution } = makeHarness();
    await service.interpret(baseInput({ tier: 'PREMIUM', memoryReference: { title: 'Loves hiking', summary: 'Weekend hikes.' } }), attribution);
    expect(streamCalls[0]!.messages[1]!.content).toContain('Loves hiking');
  });

  it('both tiers still forbid fabricating cards/memories — the hard rules text is present in both prompts', async () => {
    const { service, streamCalls, attribution } = makeHarness();
    await service.interpret(baseInput({ tier: 'FREE' }), attribution);
    const freePrompt = streamCalls[0]!.messages[0]!.content;
    await service.interpret(baseInput({ tier: 'PREMIUM' }), attribution);
    const premiumPrompt = streamCalls[1]!.messages[0]!.content;
    for (const prompt of [freePrompt, premiumPrompt]) {
      expect(prompt).toMatch(/never choose, change, add, or remove a card/i);
      expect(prompt).toMatch(/Never fabricate a user memory/i);
    }
  });
});

describe('TarotInterpretationService — safety pipeline unaffected by tier', () => {
  it('a refused input short-circuits before any provider call, regardless of tier', async () => {
    const { service, orchestrator, safety, attribution } = makeHarness();
    safety.checkInput.mockReturnValue({ allowed: false, category: 'self_harm', refusalMessage: 'refused' });
    const result = await service.interpret(baseInput({ tier: 'PREMIUM', question: 'unsafe question' }), attribution);
    expect(result).toBe('refused');
    expect(orchestrator.stream).not.toHaveBeenCalled();
  });

  it('a refused output is returned as the refusal message, not the raw generated content', async () => {
    const { service, safety, attribution } = makeHarness();
    safety.checkOutput.mockReturnValue({ allowed: false, category: 'unsafe', refusalMessage: 'output refused' });
    const result = await service.interpret(baseInput({ tier: 'FREE' }), attribution);
    expect(result).toBe('output refused');
  });
});

describe('TarotInterpretationService — Sprint 12 AI cost-control/attribution parity', () => {
  it('forwards feature="tarot" and the reading id to the orchestrator for ProviderLog attribution', async () => {
    const { service, streamCalls, attribution } = makeHarness();
    await service.interpret(baseInput(), attribution);
    expect(streamCalls[0]!.attribution).toEqual({ feature: 'tarot', sourceId: 'reading-1' });
  });

  it('records AIUsage with feature="tarot" once a real provider call completes (a done chunk was received)', async () => {
    const { service, costControl, observability, attribution } = makeHarness();
    await service.interpret(baseInput(), attribution);

    expect(costControl.record).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-1', feature: 'tarot', sourceId: 'reading-1', provider: 'mock', model: 'mock-model', promptTokens: 100, completionTokens: 50 }),
    );
    expect(observability.logUsage).toHaveBeenCalledWith(expect.objectContaining({ feature: 'tarot', sourceId: 'reading-1' }));
  });

  it('still records usage even when the output is ultimately safety-refused — a real token cost was incurred either way', async () => {
    const { service, safety, costControl, attribution } = makeHarness();
    safety.checkOutput.mockReturnValue({ allowed: false, category: 'unsafe', refusalMessage: 'output refused' });

    await service.interpret(baseInput(), attribution);

    expect(costControl.record).toHaveBeenCalledTimes(1);
  });

  it('never records usage when no done chunk was ever received (provider error before completion)', async () => {
    const { service, costControl, attribution } = makeHarness('partial', { withDoneChunk: false });

    await service.interpret(baseInput(), attribution);

    expect(costControl.record).not.toHaveBeenCalled();
  });

  it('never records usage when the input was refused before any provider call', async () => {
    const { service, safety, costControl, attribution } = makeHarness();
    safety.checkInput.mockReturnValue({ allowed: false, category: 'self_harm', refusalMessage: 'refused' });

    await service.interpret(baseInput({ question: 'unsafe' }), attribution);

    expect(costControl.record).not.toHaveBeenCalled();
  });
});
