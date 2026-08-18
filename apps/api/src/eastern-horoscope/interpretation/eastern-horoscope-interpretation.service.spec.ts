import { EasternHoroscopeInterpretationService } from './eastern-horoscope-interpretation.service';
import type { InterpretationInput } from '../eastern-horoscope.types';

function baseInput(overrides: Partial<InterpretationInput> = {}): InterpretationInput {
  return {
    stem: 'Giáp',
    branch: 'Thìn',
    element: 'Mộc',
    yinYang: 'Dương',
    zodiacAnimal: { vi: 'Rồng', en: 'Dragon' },
    yearEnergy: {
      calendarYear: 2023,
      yearStem: 'Quý',
      yearElement: 'Thủy',
      yearZodiacAnimal: { vi: 'Mèo', en: 'Cat' },
      relationship: 'GENERATES',
    },
    tier: 'FREE',
    memoryReference: null,
    ...overrides,
  };
}

const ATTRIBUTION = { userId: 'user-1', sourceId: 'profile-1' };

function makeHarness(streamedContent = 'A grounded reflection about your year.', options: { withDoneChunk?: boolean } = {}) {
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
        yield { type: 'done', usage: { promptTokens: 80, completionTokens: 40, totalTokens: 120 }, model: 'mock-model', provider: 'mock' };
      }
    }),
  };
  const safety = { checkOutput: jest.fn().mockReturnValue({ allowed: true }) };
  const costControl = { record: jest.fn().mockResolvedValue(0.001) };
  const observability = { logUsage: jest.fn() };
  const service = new EasternHoroscopeInterpretationService(orchestrator as never, safety as never, costControl as never, observability as never);
  return { service, orchestrator, safety, costControl, observability, streamCalls };
}

describe('EasternHoroscopeInterpretationService — Free vs Premium interpretation depth', () => {
  it('FREE uses the shorter token budget and the FREE system prompt', async () => {
    // Memory-reference tier-gating happens one layer up, in EasternHoroscopeRecordService (it only
    // fetches/passes a memoryReference when isPremium) — this service faithfully renders whatever
    // it's given, mirroring NumerologyInterpretationService's own single-responsibility split.
    const { service, streamCalls } = makeHarness();
    await service.interpret(baseInput({ tier: 'FREE', memoryReference: null }), ATTRIBUTION);
    expect(streamCalls[0]!.chatOptions.maxTokens).toBe(400);
    expect(streamCalls[0]!.messages[0]!.content).toMatch(/brief and clear/i);
    expect(streamCalls[0]!.messages[0]!.content).not.toMatch(/Premium \(deeper\)/i);
  });

  it('PREMIUM uses the deeper token budget and includes a provided memory reference', async () => {
    const { service, streamCalls } = makeHarness();
    await service.interpret(baseInput({ tier: 'PREMIUM', memoryReference: { title: 'Loves hiking', summary: 'Mentioned weekend hikes.' } }), ATTRIBUTION);
    expect(streamCalls[0]!.chatOptions.maxTokens).toBe(700);
    expect(streamCalls[0]!.messages[0]!.content).toMatch(/Premium \(deeper\)/i);
    expect(streamCalls[0]!.messages[1]!.content).toMatch(/Loves hiking/);
  });

  it('forwards feature="eastern_horoscope" and the sourceId to the orchestrator for AIUsage/ProviderLog attribution', async () => {
    const { streamCalls, service } = makeHarness();
    await service.interpret(baseInput(), ATTRIBUTION);
    expect(streamCalls[0]!.attribution).toEqual({ feature: 'eastern_horoscope', sourceId: 'profile-1' });
    void service;
  });

  it('embeds the real Stem/Branch/Element/Year-Energy facts in the prompt, never inventing additional facts', async () => {
    const { service, streamCalls } = makeHarness();
    await service.interpret(baseInput(), ATTRIBUTION);
    const userMessage = streamCalls[0]!.messages[1]!.content;
    expect(userMessage).toMatch(/Dragon/);
    expect(userMessage).toMatch(/Mộc/);
    expect(userMessage).toMatch(/2023/);
    void service;
  });
});

describe('EasternHoroscopeInterpretationService — safety and cost control', () => {
  it('returns the refusal message but still records real cost when output is unsafe (the provider call happened either way)', async () => {
    const { service, safety, costControl } = makeHarness('unsafe content');
    safety.checkOutput.mockReturnValue({ allowed: false, refusalMessage: 'refused', category: 'unsafe_content' });
    const result = await service.interpret(baseInput(), ATTRIBUTION);
    expect(result).toBe('refused');
    expect(costControl.record).toHaveBeenCalledWith(expect.objectContaining({ feature: 'eastern_horoscope' }));
  });

  it('records AIUsage/ProviderLog attribution once a real provider call completes', async () => {
    const { service, costControl, observability } = makeHarness();
    await service.interpret(baseInput(), ATTRIBUTION);
    expect(costControl.record).toHaveBeenCalledWith(expect.objectContaining({ userId: 'user-1', feature: 'eastern_horoscope', sourceId: 'profile-1' }));
    expect(observability.logUsage).toHaveBeenCalledWith(expect.objectContaining({ feature: 'eastern_horoscope' }));
  });

  it('returns null and never throws on a provider stream error', async () => {
    const { service } = makeHarness();
    const orchestrator = { stream: jest.fn(async function* () { yield { type: 'error', code: 'provider_unavailable' }; }) };
    const safety = { checkOutput: jest.fn() };
    const costControl = { record: jest.fn() };
    const observability = { logUsage: jest.fn() };
    const failingService = new EasternHoroscopeInterpretationService(orchestrator as never, safety as never, costControl as never, observability as never);
    const result = await failingService.interpret(baseInput(), ATTRIBUTION);
    expect(result).toBeNull();
    expect(costControl.record).not.toHaveBeenCalled();
    void service;
  });

  it('returns null for an empty streamed response rather than an empty string', async () => {
    const { service } = makeHarness('   ');
    const result = await service.interpret(baseInput(), ATTRIBUTION);
    expect(result).toBeNull();
  });
});
