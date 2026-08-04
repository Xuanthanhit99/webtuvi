import { ContextBudgetService } from './context-budget.service';

function makeConfigService(overrides: Partial<{
  totalWindowTokens: number;
  reservedOutputTokens: number;
  conversationMaxTokens: number;
  memoryMaxTokens: number;
}> = {}) {
  const contextBudget = {
    totalWindowTokens: 8000,
    reservedOutputTokens: 1000,
    conversationMaxTokens: 3000,
    memoryMaxTokens: 1500,
    ...overrides,
  };
  return { get: jest.fn(() => ({ memory: { contextBudget } })) };
}

describe('ContextBudgetService.estimateTokens', () => {
  const service = new ContextBudgetService(makeConfigService() as never);

  it('estimates roughly chars/4, rounded up', () => {
    expect(service.estimateTokens('abcd')).toBe(1);
    expect(service.estimateTokens('abcde')).toBe(2);
  });

  it('returns 0 for empty text', () => {
    expect(service.estimateTokens('')).toBe(0);
  });
});

describe('ContextBudgetService.computeBudget', () => {
  it('reserves output first, then charges real cost for prompt/conversation/input, and gives the rest to memory', () => {
    const service = new ContextBudgetService(makeConfigService({ totalWindowTokens: 8000, reservedOutputTokens: 1000, memoryMaxTokens: 5000 }) as never);
    const budget = service.computeBudget({
      systemPromptText: 'x'.repeat(400), // 100 tokens
      conversationText: 'y'.repeat(800), // 200 tokens
      userInputText: 'z'.repeat(40), // 10 tokens
    });

    expect(budget.reservedOutputTokens).toBe(1000);
    expect(budget.systemPromptTokens).toBe(100);
    expect(budget.conversationTokens).toBe(200);
    expect(budget.userInputTokens).toBe(10);
    // remaining = 8000 - (1000+100+200+10) = 6690, capped at memoryMaxTokens=5000
    expect(budget.memoryTokens).toBe(5000);
  });

  it('caps conversation tokens at conversationMaxTokens even if the real text is longer', () => {
    const service = new ContextBudgetService(makeConfigService({ conversationMaxTokens: 100 }) as never);
    const budget = service.computeBudget({ conversationText: 'a'.repeat(10_000) });
    expect(budget.conversationTokens).toBe(100);
  });

  it('never lets memoryTokens go negative when other slices exceed the window', () => {
    const service = new ContextBudgetService(
      makeConfigService({ totalWindowTokens: 100, reservedOutputTokens: 90, memoryMaxTokens: 500 }) as never,
    );
    const budget = service.computeBudget({ systemPromptText: 'x'.repeat(400) }); // 100 tokens alone
    expect(budget.memoryTokens).toBe(0);
  });
});

describe('ContextBudgetService.fitToBudget', () => {
  const service = new ContextBudgetService(makeConfigService() as never);

  it('includes items while they fit, in order', () => {
    const items = [
      { id: 'a', text: 'a'.repeat(40) }, // 10 tokens
      { id: 'b', text: 'b'.repeat(40) }, // 10 tokens
      { id: 'c', text: 'c'.repeat(40) }, // 10 tokens
    ];
    const result = service.fitToBudget(items, 20);
    expect(result.included.map((i) => i.id)).toEqual(['a', 'b']);
    expect(result.excluded.map((i) => i.id)).toEqual(['c']);
    expect(result.tokenUsed).toBe(20);
  });

  it('lets a later smaller item fill a gap left by an earlier one that did not fit', () => {
    const items = [
      { id: 'big', text: 'x'.repeat(80) }, // 20 tokens — does not fit in budget 15
      { id: 'small', text: 'y'.repeat(20) }, // 5 tokens — fits
    ];
    const result = service.fitToBudget(items, 15);
    expect(result.included.map((i) => i.id)).toEqual(['small']);
    expect(result.excluded.map((i) => i.id)).toEqual(['big']);
  });

  it('returns an empty included list when budget is 0', () => {
    const result = service.fitToBudget([{ id: 'a', text: 'hello' }], 0);
    expect(result.included).toEqual([]);
    expect(result.tokenUsed).toBe(0);
  });
});
