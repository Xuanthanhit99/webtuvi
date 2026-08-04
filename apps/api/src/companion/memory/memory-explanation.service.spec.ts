import { MemoryExplanationService } from './memory-explanation.service';
import type { MemoryReferenceDto, MemorySkipReferenceDto } from './memory-reference.types';

const OWNER = 'user-1';

function makeReference(overrides: Partial<MemoryReferenceDto> = {}): MemoryReferenceDto {
  return {
    memoryId: 'mem-1',
    title: 'Learn Japanese',
    type: 'GOAL',
    reason: 'Surfaced because this relates to a goal or a decision you made.',
    retrievalType: 'IMPORTANCE_RANKED',
    importance: { score: 62, explanations: ['This relates to a goal or a decision you made.'] },
    retrievalTimestamp: '2026-08-04T00:00:00.000Z',
    sourceConversationId: 'conv-old',
    createdAt: '2026-07-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeConsentMock(mode: string) {
  return { resolveMode: jest.fn(async () => mode) };
}

describe('MemoryExplanationService.explain', () => {
  it('always begins with the literal "I remembered this because..." headline', async () => {
    const service = new MemoryExplanationService(makeConsentMock('ALLOW_TYPE') as never);
    const result = await service.explain(OWNER, makeReference());
    expect(result.headline).toBe('I remembered this because...');
  });

  it('never says "I always remember" anywhere in its output', async () => {
    const service = new MemoryExplanationService(makeConsentMock('ALLOW_TYPE') as never);
    for (const retrievalType of ['PINNED', 'CONTEXT_MATCH', 'IMPORTANCE_RANKED'] as const) {
      const result = await service.explain(OWNER, makeReference({ retrievalType }));
      const combined = `${result.headline} ${result.reason} ${result.source} ${result.consent}`.toLowerCase();
      expect(combined).not.toContain('i always remember');
    }
  });

  it('includes source, date, reason, consent, and importance — all five, every time', async () => {
    const service = new MemoryExplanationService(makeConsentMock('ALLOW_SELECTED') as never);
    const result = await service.explain(OWNER, makeReference());

    expect(result.source).toEqual(expect.any(String));
    expect(result.date).toBe('2026-07-01T00:00:00.000Z');
    expect(result.reason).toEqual(expect.any(String));
    expect(result.consent).toEqual(expect.any(String));
    expect(result.importance).toEqual({ score: 62, explanations: ['This relates to a goal or a decision you made.'] });
  });

  it('describes a pinned retrieval distinctly from a context-match or importance-ranked one', async () => {
    const service = new MemoryExplanationService(makeConsentMock('ALLOW_TYPE') as never);
    const pinned = await service.explain(OWNER, makeReference({ retrievalType: 'PINNED' }));
    const contextMatch = await service.explain(OWNER, makeReference({ retrievalType: 'CONTEXT_MATCH' }));
    const ranked = await service.explain(OWNER, makeReference({ retrievalType: 'IMPORTANCE_RANKED' }));

    expect(new Set([pinned.source, contextMatch.source, ranked.source]).size).toBe(3);
  });

  it('describes each consent mode distinctly', async () => {
    const service = new MemoryExplanationService(makeConsentMock('ALLOW_TYPE') as never);
    const allowType = await service.explain(OWNER, makeReference());

    const serviceSelected = new MemoryExplanationService(makeConsentMock('ALLOW_SELECTED') as never);
    const allowSelected = await serviceSelected.explain(OWNER, makeReference());

    const serviceAsk = new MemoryExplanationService(makeConsentMock('ASK_EVERY_TIME') as never);
    const askEveryTime = await serviceAsk.explain(OWNER, makeReference());

    expect(new Set([allowType.consent, allowSelected.consent, askEveryTime.consent]).size).toBe(3);
  });

  it('resolves consent against the memory\'s own type, not a hardcoded one', async () => {
    const consent = makeConsentMock('ALLOW_TYPE');
    const service = new MemoryExplanationService(consent as never);
    await service.explain(OWNER, makeReference({ type: 'HEALTH' }));
    expect(consent.resolveMode).toHaveBeenCalledWith(OWNER, 'HEALTH');
  });
});

describe('MemoryExplanationService.explainSkip', () => {
  const service = new MemoryExplanationService({} as never);

  function makeSkip(overrides: Partial<MemorySkipReferenceDto> = {}): MemorySkipReferenceDto {
    return { memoryId: 'mem-2', title: 'Health note', type: 'HEALTH', reason: 'consent_denied', ...overrides };
  }

  it('always begins with the literal "I didn\'t bring this up because..." headline', () => {
    const result = service.explainSkip(makeSkip());
    expect(result.headline).toBe("I didn't bring this up because...");
  });

  it('gives a distinct, honest reason for each skip cause', () => {
    const consentDenied = service.explainSkip(makeSkip({ reason: 'consent_denied' }));
    const overBudget = service.explainSkip(makeSkip({ reason: 'over_budget' }));
    const limitReached = service.explainSkip(makeSkip({ reason: 'limit_reached' }));

    expect(new Set([consentDenied.reason, overBudget.reason, limitReached.reason]).size).toBe(3);
  });
});
