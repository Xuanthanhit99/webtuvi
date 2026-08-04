import { CompanionForgetService } from './companion-forget.service';

const OWNER = 'user-1';

interface MemoryOverrides {
  id: string;
  type?: string;
  title?: string;
  summary?: string;
  sourceConversationId?: string | null;
  createdAt?: Date;
}

function makeMemory(o: MemoryOverrides) {
  return {
    id: o.id,
    userId: OWNER,
    type: o.type ?? 'PREFERENCE',
    title: o.title ?? 'Title',
    summary: o.summary ?? 'Summary',
    status: 'ACCEPTED',
    sourceConversationId: o.sourceConversationId ?? null,
    createdAt: o.createdAt ?? new Date(),
  };
}

function makePrismaMock(memories: ReturnType<typeof makeMemory>[]) {
  return {
    memory: {
      findFirst: jest.fn(async ({ where }: { where: Record<string, unknown> }) =>
        memories
          .filter((m) => m.userId === where.userId && m.status === where.status && (!where.sourceConversationId || m.sourceConversationId === where.sourceConversationId))
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0] ?? null,
      ),
      findMany: jest.fn(async ({ where }: { where: { userId: string; status: string } }) =>
        memories.filter((m) => m.userId === where.userId && m.status === where.status),
      ),
    },
  };
}

function makeRecordsMock() {
  return { remove: jest.fn(async () => undefined) };
}

function makeConsentMock() {
  return { updateType: jest.fn(async () => undefined) };
}

describe('CompanionForgetService.evaluate', () => {
  it('returns null when no forget-intent is detected', async () => {
    const service = new CompanionForgetService(makePrismaMock([]) as never, makeRecordsMock() as never, makeConsentMock() as never);
    const result = await service.evaluate(OWNER, 'conv-1', 'I had a nice day');
    expect(result).toBeNull();
  });

  it('FORGET_RECENT finds the most recent memory sourced from this conversation', async () => {
    const memories = [
      makeMemory({ id: 'a', sourceConversationId: 'conv-1', createdAt: new Date('2026-01-01') }),
      makeMemory({ id: 'b', sourceConversationId: 'conv-1', createdAt: new Date('2026-02-01') }),
      makeMemory({ id: 'c', sourceConversationId: 'conv-2', createdAt: new Date('2026-03-01') }),
    ];
    const service = new CompanionForgetService(makePrismaMock(memories) as never, makeRecordsMock() as never, makeConsentMock() as never);

    const result = await service.evaluate(OWNER, 'conv-1', 'Forget that.');
    expect(result?.kind).toBe('FORGET_RECENT');
    expect(result?.candidates).toHaveLength(1);
    expect(result?.candidates[0]!.memoryId).toBe('b');
  });

  it('FORGET_RECENT is honest when nothing has been saved from this conversation', async () => {
    const service = new CompanionForgetService(makePrismaMock([]) as never, makeRecordsMock() as never, makeConsentMock() as never);
    const result = await service.evaluate(OWNER, 'conv-1', "Don't remember this.");
    expect(result?.candidates).toEqual([]);
    expect(result?.message).toMatch(/nothing to forget/i);
  });

  it('NEVER_REMEMBER_TYPE never touches the database — it is a pure suggestion until confirmed', async () => {
    const prisma = makePrismaMock([]);
    const service = new CompanionForgetService(prisma as never, makeRecordsMock() as never, makeConsentMock() as never);

    const result = await service.evaluate(OWNER, 'conv-1', 'Never remember my health stuff');
    expect(result?.kind).toBe('NEVER_REMEMBER_TYPE');
    expect(result?.type).toBe('HEALTH');
    expect(prisma.memory.findFirst).not.toHaveBeenCalled();
    expect(prisma.memory.findMany).not.toHaveBeenCalled();
  });

  it('DELETE_ABOUT finds memories whose text overlaps the topic', async () => {
    const memories = [
      makeMemory({ id: 'a', title: 'Ex', summary: 'My ex is named Sam' }),
      makeMemory({ id: 'b', title: 'Coffee', summary: 'I like coffee' }),
    ];
    const service = new CompanionForgetService(makePrismaMock(memories) as never, makeRecordsMock() as never, makeConsentMock() as never);

    const result = await service.evaluate(OWNER, 'conv-1', 'Delete everything about my ex');
    expect(result?.kind).toBe('DELETE_ABOUT');
    expect(result?.candidates.map((c) => c.memoryId)).toEqual(['a']);
  });

  it('DELETE_ABOUT is honest when nothing matches', async () => {
    const memories = [makeMemory({ id: 'a', title: 'Coffee', summary: 'I like coffee' })];
    const service = new CompanionForgetService(makePrismaMock(memories) as never, makeRecordsMock() as never, makeConsentMock() as never);

    const result = await service.evaluate(OWNER, 'conv-1', 'Delete everything about my childhood home');
    expect(result?.candidates).toEqual([]);
    expect(result?.message).toMatch(/couldn't find/i);
  });
});

describe('CompanionForgetService.confirmDelete / confirmNeverRemember', () => {
  it('confirmDelete calls MemoryRecordService.remove for every confirmed id, ownership enforced downstream', async () => {
    const records = makeRecordsMock();
    const service = new CompanionForgetService(makePrismaMock([]) as never, records as never, makeConsentMock() as never);

    await service.confirmDelete(OWNER, ['mem-1', 'mem-2']);

    expect(records.remove).toHaveBeenCalledWith(OWNER, 'mem-1');
    expect(records.remove).toHaveBeenCalledWith(OWNER, 'mem-2');
    expect(records.remove).toHaveBeenCalledTimes(2);
  });

  it('confirmNeverRemember calls the existing consent mutation with DENY_TYPE', async () => {
    const consent = makeConsentMock();
    const service = new CompanionForgetService(makePrismaMock([]) as never, makeRecordsMock() as never, consent as never);

    await service.confirmNeverRemember(OWNER, 'HEALTH');

    expect(consent.updateType).toHaveBeenCalledWith(OWNER, 'HEALTH', 'DENY_TYPE');
  });
});
