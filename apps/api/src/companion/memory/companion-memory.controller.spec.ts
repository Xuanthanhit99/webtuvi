import { NotFoundException } from '@nestjs/common';
import { CompanionMemoryController } from './companion-memory.controller';

const OWNER = { id: 'user-1' } as never;

function makePrismaMock(message: Record<string, unknown> | null) {
  return { conversationMessage: { findFirst: jest.fn(async () => message) } };
}

function makeConversationServiceMock(ownedThrows = false) {
  return {
    findOwned: jest.fn(async () => {
      if (ownedThrows) throw new NotFoundException({ code: 'CONVERSATION_NOT_FOUND' });
      return { id: 'conv-1', userId: 'user-1' };
    }),
  };
}

function makeExplanationMock() {
  return { explain: jest.fn(async () => ({ headline: 'I remembered this because...' })) };
}

function makeSuggestionsMock() {
  return { dismiss: jest.fn(async () => undefined) };
}

function makeForgetMock() {
  return { confirmDelete: jest.fn(async () => undefined), confirmNeverRemember: jest.fn(async () => undefined) };
}

describe('CompanionMemoryController.explainUsedMemory — Phase 12 security', () => {
  it('404s (via ConversationService.findOwned) for a conversation the caller does not own — never leaks another user\'s message', async () => {
    const prisma = makePrismaMock(null);
    const conversationService = makeConversationServiceMock(true);
    const controller = new CompanionMemoryController(prisma as never, conversationService as never, makeExplanationMock() as never, makeSuggestionsMock() as never, makeForgetMock() as never);

    await expect(controller.explainUsedMemory(OWNER, 'conv-1', 'msg-1', 'mem-1')).rejects.toThrow(NotFoundException);
    // The message table is never even queried if ownership already failed.
    expect(prisma.conversationMessage.findFirst).not.toHaveBeenCalled();
  });

  it('404s for a message that does not exist', async () => {
    const prisma = makePrismaMock(null);
    const controller = new CompanionMemoryController(prisma as never, makeConversationServiceMock() as never, makeExplanationMock() as never, makeSuggestionsMock() as never, makeForgetMock() as never);

    await expect(controller.explainUsedMemory(OWNER, 'conv-1', 'missing-msg', 'mem-1')).rejects.toThrow(NotFoundException);
  });

  it('404s when asked to explain a memoryId that was not actually used in that message — cannot fish for explanations of arbitrary memories', async () => {
    const prisma = makePrismaMock({
      id: 'msg-1',
      metadata: { memoryUsage: { used: [{ memoryId: 'mem-1', title: 'x', type: 'GOAL', reason: 'x', retrievalType: 'PINNED', importance: { score: 1, explanations: [] }, retrievalTimestamp: 'x', sourceConversationId: null, createdAt: 'x' }] } },
    });
    const controller = new CompanionMemoryController(prisma as never, makeConversationServiceMock() as never, makeExplanationMock() as never, makeSuggestionsMock() as never, makeForgetMock() as never);

    await expect(controller.explainUsedMemory(OWNER, 'conv-1', 'msg-1', 'mem-does-not-belong-here')).rejects.toThrow(NotFoundException);
  });

  it('404s for a message with no memory usage at all', async () => {
    const prisma = makePrismaMock({ id: 'msg-1', metadata: null });
    const controller = new CompanionMemoryController(prisma as never, makeConversationServiceMock() as never, makeExplanationMock() as never, makeSuggestionsMock() as never, makeForgetMock() as never);

    await expect(controller.explainUsedMemory(OWNER, 'conv-1', 'msg-1', 'mem-1')).rejects.toThrow(NotFoundException);
  });

  it('succeeds and calls MemoryExplanationService.explain with the caller\'s own id when the reference is genuinely present', async () => {
    const prisma = makePrismaMock({
      id: 'msg-1',
      metadata: { memoryUsage: { used: [{ memoryId: 'mem-1', title: 'x', type: 'GOAL', reason: 'x', retrievalType: 'PINNED', importance: { score: 1, explanations: [] }, retrievalTimestamp: 'x', sourceConversationId: null, createdAt: 'x' }] } },
    });
    const explanation = makeExplanationMock();
    const controller = new CompanionMemoryController(prisma as never, makeConversationServiceMock() as never, explanation as never, makeSuggestionsMock() as never, makeForgetMock() as never);

    await controller.explainUsedMemory(OWNER, 'conv-1', 'msg-1', 'mem-1');

    expect(explanation.explain).toHaveBeenCalledWith('user-1', expect.objectContaining({ memoryId: 'mem-1' }));
  });
});

describe('CompanionMemoryController mutations — always scoped to the authenticated caller', () => {
  it('dismissSuggestion passes the authenticated user id, never a client-supplied one (DTO has no userId field)', async () => {
    const suggestions = makeSuggestionsMock();
    const controller = new CompanionMemoryController({} as never, makeConversationServiceMock() as never, makeExplanationMock() as never, suggestions as never, makeForgetMock() as never);

    await controller.dismissSuggestion(OWNER, { type: 'GOAL' } as never);

    expect(suggestions.dismiss).toHaveBeenCalledWith('user-1', 'GOAL');
  });

  it('confirmDelete passes the authenticated user id to CompanionForgetService.confirmDelete', async () => {
    const forget = makeForgetMock();
    const controller = new CompanionMemoryController({} as never, makeConversationServiceMock() as never, makeExplanationMock() as never, makeSuggestionsMock() as never, forget as never);

    await controller.confirmDelete(OWNER, { memoryIds: ['mem-1', 'mem-2'] } as never);

    expect(forget.confirmDelete).toHaveBeenCalledWith('user-1', ['mem-1', 'mem-2']);
  });

  it('confirmNeverRemember passes the authenticated user id to CompanionForgetService.confirmNeverRemember', async () => {
    const forget = makeForgetMock();
    const controller = new CompanionMemoryController({} as never, makeConversationServiceMock() as never, makeExplanationMock() as never, makeSuggestionsMock() as never, forget as never);

    await controller.confirmNeverRemember(OWNER, { type: 'HEALTH' } as never);

    expect(forget.confirmNeverRemember).toHaveBeenCalledWith('user-1', 'HEALTH');
  });
});
