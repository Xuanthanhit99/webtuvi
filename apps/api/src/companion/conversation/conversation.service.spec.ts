import { NotFoundException, HttpException } from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { SafetyService } from '../safety/safety.service';
import type { CostControlService } from '../cost/cost-control.service';

function makeCostControlMock(allowed = true): CostControlService {
  return {
    checkBudget: jest.fn(async () => (allowed ? { allowed: true } : { allowed: false, reason: 'daily_request_limit', message: 'Daily limit reached' })),
  } as unknown as CostControlService;
}

function makeMemorySuggestionMock() {
  return { evaluate: jest.fn(async () => null) };
}

function makeForgetMock() {
  return { evaluate: jest.fn(async () => null) };
}

function makePrismaMock() {
  const conversations = new Map<string, { id: string; userId: string; title: string | null; status: string; createdAt: Date; updatedAt: Date }>();
  const messages: { id: string; conversationId: string; role: string; content: string; createdAt: Date }[] = [];
  let idCounter = 0;

  return {
    _conversations: conversations,
    _messages: messages,
    conversation: {
      create: jest.fn(async ({ data }: { data: { userId: string; title?: string } }) => {
        idCounter += 1;
        const record = {
          id: `conv-${idCounter}`,
          userId: data.userId,
          title: data.title ?? null,
          status: 'ACTIVE',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        conversations.set(record.id, record);
        return record;
      }),
      findUnique: jest.fn(async ({ where: { id } }: { where: { id: string } }) => conversations.get(id) ?? null),
      findMany: jest.fn(async ({ where }: { where: { userId: string } }) =>
        [...conversations.values()]
          .filter((c) => c.userId === where.userId)
          .map((c) => ({ ...c, _count: { messages: messages.filter((m) => m.conversationId === c.id).length } })),
      ),
      update: jest.fn(async ({ where: { id }, data }: { where: { id: string }; data: { updatedAt: Date } }) => {
        const record = conversations.get(id)!;
        record.updatedAt = data.updatedAt;
        return record;
      }),
      delete: jest.fn(async ({ where: { id } }: { where: { id: string } }) => {
        conversations.delete(id);
      }),
    },
    conversationMessage: {
      create: jest.fn(async ({ data }: { data: { conversationId: string; role: string; content: string; metadata?: unknown } }) => {
        idCounter += 1;
        const record = { id: `msg-${idCounter}`, conversationId: data.conversationId, role: data.role, content: data.content, createdAt: new Date() };
        messages.push(record);
        return record;
      }),
      findMany: jest.fn(async ({ where: { conversationId } }: { where: { conversationId: string } }) =>
        messages.filter((m) => m.conversationId === conversationId),
      ),
    },
  };
}

describe('ConversationService', () => {
  let prisma: ReturnType<typeof makePrismaMock>;
  let service: ConversationService;

  beforeEach(() => {
    prisma = makePrismaMock();
    service = new ConversationService(
      prisma as never,
      new SafetyService(),
      makeCostControlMock(),
      makeMemorySuggestionMock() as never,
      makeForgetMock() as never,
    );
  });

  it('creates a conversation owned by the calling user', async () => {
    const conversation = await service.create('user-1', 'My first chat');
    expect(conversation.title).toBe('My first chat');
    expect(conversation.messageCount).toBe(0);
    expect(conversation.status).toBe('active');
  });

  it('lists only the calling user’s conversations', async () => {
    await service.create('user-1', 'A');
    await service.create('user-2', 'B');

    const list = await service.list('user-1');
    expect(list).toHaveLength(1);
    expect(list[0]!.title).toBe('A');
  });

  it('throws 404 (not 403) when reading a conversation owned by someone else', async () => {
    const conversation = await service.create('user-1', 'Private');
    await expect(service.getOne('user-2', conversation.id)).rejects.toThrow(NotFoundException);
  });

  it('throws 404 for a conversation id that does not exist at all — same error as someone else’s conversation', async () => {
    await expect(service.getOne('user-1', 'does-not-exist')).rejects.toThrow(NotFoundException);
  });

  it('sendMessage persists the user message and requires generation for ordinary content', async () => {
    const conversation = await service.create('user-1', undefined);
    const result = await service.sendMessage('user-1', conversation.id, 'Hello there');

    expect(result.userMessage.role).toBe('user');
    expect(result.userMessage.content).toBe('Hello there');
    expect(result.requiresGeneration).toBe(true);
    expect(result.assistantMessage).toBeNull();
  });

  it('sendMessage short-circuits on crisis content: persists a refusal reply and does not require generation', async () => {
    const conversation = await service.create('user-1', undefined);
    const result = await service.sendMessage('user-1', conversation.id, 'I want to kill myself');

    expect(result.requiresGeneration).toBe(false);
    expect(result.assistantMessage).not.toBeNull();
    expect(result.assistantMessage!.role).toBe('assistant');
    expect(result.assistantMessage!.content).toMatch(/988|crisis/i);
  });

  it('sendMessage rejects sending into a conversation the caller does not own', async () => {
    const conversation = await service.create('user-1', undefined);
    await expect(service.sendMessage('user-2', conversation.id, 'hi')).rejects.toThrow(NotFoundException);
  });

  it('sendMessage rejects with a normalized 429 when the usage budget is exceeded, persisting nothing', async () => {
    const overBudgetService = new ConversationService(
      prisma as never,
      new SafetyService(),
      makeCostControlMock(false),
      makeMemorySuggestionMock() as never,
      makeForgetMock() as never,
    );
    const conversation = await overBudgetService.create('user-1', undefined);

    await expect(overBudgetService.sendMessage('user-1', conversation.id, 'hello')).rejects.toThrow(HttpException);
    const detail = await overBudgetService.getOne('user-1', conversation.id);
    expect(detail.messages).toHaveLength(0);
  });

  it('sendMessage HttpException carries the normalized AI_BUDGET_EXCEEDED shape', async () => {
    const overBudgetService = new ConversationService(
      prisma as never,
      new SafetyService(),
      makeCostControlMock(false),
      makeMemorySuggestionMock() as never,
      makeForgetMock() as never,
    );
    const conversation = await overBudgetService.create('user-1', undefined);

    try {
      await overBudgetService.sendMessage('user-1', conversation.id, 'hello');
      throw new Error('expected sendMessage to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(429);
      expect((error as HttpException).getResponse()).toMatchObject({ code: 'AI_BUDGET_EXCEEDED' });
    }
  });

  it('delete removes the conversation and rejects deleting someone else’s', async () => {
    const conversation = await service.create('user-1', undefined);
    await expect(service.delete('user-2', conversation.id)).rejects.toThrow(NotFoundException);

    await service.delete('user-1', conversation.id);
    expect(prisma._conversations.has(conversation.id)).toBe(false);
  });
});
