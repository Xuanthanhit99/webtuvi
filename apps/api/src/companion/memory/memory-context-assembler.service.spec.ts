import { MemoryContextAssembler, MAX_MEMORIES_PER_TURN } from './memory-context-assembler.service';
import type { RetrievalResultDto } from '../../memory/retrieval/memory-retrieval.service';

const OWNER = 'user-1';

function makeResult(overrides: Partial<RetrievalResultDto> = {}): RetrievalResultDto {
  return {
    items: [],
    skipped: [],
    candidateCount: 0,
    budget: { totalWindowTokens: 8000, reservedOutputTokens: 1024, systemPromptTokens: 0, conversationTokens: 0, userInputTokens: 0, memoryTokens: 1500 },
    tokenUsed: 0,
    ...overrides,
  };
}

function makeItem(overrides: Partial<RetrievalResultDto['items'][number]> = {}) {
  return {
    id: 'mem-1',
    type: 'GOAL' as const,
    title: 'Learn Japanese',
    summary: 'Working toward JLPT N3',
    pinned: false,
    importanceScore: 62,
    importanceExplanations: ['This relates to a goal or a decision you made.'],
    whyRecommended: 'Surfaced because this relates to a goal or a decision you made.',
    retrievalType: 'IMPORTANCE_RANKED' as const,
    retrievalTimestamp: '2026-08-04T00:00:00.000Z',
    sourceConversationId: 'conv-old',
    createdAt: '2026-07-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeRetrievalMock(result: RetrievalResultDto) {
  return { recommend: jest.fn(async () => result) };
}

describe('MemoryContextAssembler', () => {
  it('returns a null promptBlock and empty references when nothing is retrieved', async () => {
    const retrieval = makeRetrievalMock(makeResult());
    const assembler = new MemoryContextAssembler(retrieval as never);

    const result = await assembler.assemble(OWNER, { userMessage: 'hi', systemPromptText: 'sys', conversationText: '' });

    expect(result.promptBlock).toBeNull();
    expect(result.used).toEqual([]);
    expect(result.skipped).toEqual([]);
  });

  it('calls MemoryRetrievalService.recommend with the user message as context and a hard per-turn limit', async () => {
    const retrieval = makeRetrievalMock(makeResult());
    const assembler = new MemoryContextAssembler(retrieval as never);

    await assembler.assemble(OWNER, { userMessage: 'tell me about my goals', systemPromptText: 'sys', conversationText: 'history' });

    expect(retrieval.recommend).toHaveBeenCalledWith(OWNER, {
      contextText: 'tell me about my goals',
      systemPromptText: 'sys',
      conversationText: 'history',
      userInputText: 'tell me about my goals',
      limit: MAX_MEMORIES_PER_TURN,
    });
  });

  it('maps every retrieved item to a full MemoryReferenceDto with all five required fields (Phase 2)', async () => {
    const retrieval = makeRetrievalMock(makeResult({ items: [makeItem()] }));
    const assembler = new MemoryContextAssembler(retrieval as never);

    const result = await assembler.assemble(OWNER, { userMessage: 'x', systemPromptText: 'sys', conversationText: '' });

    expect(result.used).toEqual([
      {
        memoryId: 'mem-1',
        title: 'Learn Japanese',
        type: 'GOAL',
        reason: 'Surfaced because this relates to a goal or a decision you made.',
        retrievalType: 'IMPORTANCE_RANKED',
        importance: { score: 62, explanations: ['This relates to a goal or a decision you made.'] },
        retrievalTimestamp: '2026-08-04T00:00:00.000Z',
        sourceConversationId: 'conv-old',
        createdAt: '2026-07-01T00:00:00.000Z',
      },
    ]);
  });

  it('builds a labeled prompt block containing the memory summary text, never the raw score alone', async () => {
    const retrieval = makeRetrievalMock(makeResult({ items: [makeItem()] }));
    const assembler = new MemoryContextAssembler(retrieval as never);

    const result = await assembler.assemble(OWNER, { userMessage: 'x', systemPromptText: 'sys', conversationText: '' });

    expect(result.promptBlock).toContain('Learn Japanese');
    expect(result.promptBlock).toContain('Working toward JLPT N3');
    expect(result.promptBlock).toContain('never force them in');
    expect(result.promptBlock).not.toContain('62'); // the raw score never appears in the model-facing prompt
  });

  it('maps skipped items to the companion-facing skip DTO shape', async () => {
    const retrieval = makeRetrievalMock(
      makeResult({ skipped: [{ id: 'mem-2', type: 'HEALTH', title: 'Health note', reason: 'consent_denied' }] }),
    );
    const assembler = new MemoryContextAssembler(retrieval as never);

    const result = await assembler.assemble(OWNER, { userMessage: 'x', systemPromptText: 'sys', conversationText: '' });

    expect(result.skipped).toEqual([{ memoryId: 'mem-2', title: 'Health note', type: 'HEALTH', reason: 'consent_denied' }]);
  });

  it('reports the token budget/usage from the underlying retrieval result', async () => {
    const retrieval = makeRetrievalMock(
      makeResult({ items: [makeItem()], tokenUsed: 42, budget: { totalWindowTokens: 8000, reservedOutputTokens: 1024, systemPromptTokens: 10, conversationTokens: 5, userInputTokens: 2, memoryTokens: 1500 } }),
    );
    const assembler = new MemoryContextAssembler(retrieval as never);

    const result = await assembler.assemble(OWNER, { userMessage: 'x', systemPromptText: 'sys', conversationText: '' });

    expect(result.memoryTokenBudget).toBe(1500);
    expect(result.memoryTokenUsed).toBe(42);
  });
});
