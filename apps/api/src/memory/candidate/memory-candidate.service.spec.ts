import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { MemoryCandidateService } from './memory-candidate.service';
import type { MemoryConsentService } from '../consent/memory-consent.service';
import type { MemoryAuditService } from '../audit/memory-audit.service';

const OWNER = 'user-1';
const OTHER = 'user-2';

function makePrismaMock() {
  const conversations = new Map<string, { id: string; userId: string }>();
  const messages = new Map<string, { id: string; conversationId: string; role: string }>();
  const candidates = new Map<string, Record<string, unknown>>();
  const memories = new Map<string, Record<string, unknown>>();
  const versions: Record<string, unknown>[] = [];
  let counter = 0;

  conversations.set('conv-1', { id: 'conv-1', userId: OWNER });
  messages.set('msg-user-1', { id: 'msg-user-1', conversationId: 'conv-1', role: 'USER' });
  messages.set('msg-assistant-1', { id: 'msg-assistant-1', conversationId: 'conv-1', role: 'ASSISTANT' });

  const tx = {
    memory: {
      create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
        counter += 1;
        const record = {
          id: `mem-${counter}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          archivedAt: null,
          ...data,
        };
        memories.set(record.id, record);
        return record;
      }),
    },
    memoryVersion: {
      create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
        versions.push(data);
        return data;
      }),
    },
    memoryCandidate: {
      update: jest.fn(async ({ where: { id }, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        const existing = candidates.get(id)!;
        const updated = { ...existing, ...data };
        candidates.set(id, updated);
        return updated;
      }),
    },
  };

  return {
    _candidates: candidates,
    _memories: memories,
    _versions: versions,
    conversation: {
      findUnique: jest.fn(async ({ where: { id } }: { where: { id: string } }) => conversations.get(id) ?? null),
    },
    conversationMessage: {
      findUnique: jest.fn(async ({ where: { id } }: { where: { id: string } }) => messages.get(id) ?? null),
    },
    memoryCandidate: {
      create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
        counter += 1;
        const record = {
          id: `cand-${counter}`,
          resultingMemoryId: null,
          resolvedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data,
        };
        candidates.set(record.id, record);
        return record;
      }),
      findUnique: jest.fn(async ({ where: { id } }: { where: { id: string } }) => candidates.get(id) ?? null),
      update: jest.fn(async ({ where: { id }, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        const existing = candidates.get(id)!;
        const updated = { ...existing, ...data };
        candidates.set(id, updated);
        return updated;
      }),
    },
    memory: {
      findUnique: jest.fn(async ({ where: { id } }: { where: { id: string } }) => memories.get(id) ?? null),
    },
    $transaction: jest.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn(tx)),
  };
}

function makeConsentMock(allowed = true): MemoryConsentService {
  return {
    canAccept: jest.fn(async () => (allowed ? { allowed: true, mode: 'ALLOW_SELECTED' } : { allowed: false, mode: 'DENY_TYPE', reason: 'deny_type' })),
  } as unknown as MemoryConsentService;
}

function makeAuditMock(): MemoryAuditService {
  return { record: jest.fn(async () => undefined) } as unknown as MemoryAuditService;
}

describe('MemoryCandidateService', () => {
  it('proposes a candidate from a real user-authored source message', async () => {
    const prisma = makePrismaMock();
    const service = new MemoryCandidateService(prisma as never, makeConsentMock(), makeAuditMock());

    const candidate = await service.propose(OWNER, {
      proposedType: 'GOAL',
      proposedTitle: 'New job',
      proposedSummary: 'Starting a new job next week',
      sourceConversationId: 'conv-1',
      sourceMessageId: 'msg-user-1',
    });

    expect(candidate.status).toBe('CANDIDATE');
    expect(candidate.sourceMessageId).toBe('msg-user-1');
  });

  it('rejects proposing a candidate sourced from an assistant-authored message', async () => {
    const prisma = makePrismaMock();
    const service = new MemoryCandidateService(prisma as never, makeConsentMock(), makeAuditMock());

    await expect(
      service.propose(OWNER, {
        proposedType: 'GOAL',
        proposedTitle: 'Fabricated',
        proposedSummary: 'Assistant said this',
        sourceConversationId: 'conv-1',
        sourceMessageId: 'msg-assistant-1',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects proposing a candidate from a conversation owned by another user', async () => {
    const prisma = makePrismaMock();
    const service = new MemoryCandidateService(prisma as never, makeConsentMock(), makeAuditMock());

    await expect(
      service.propose(OTHER, {
        proposedType: 'GOAL',
        proposedTitle: 'Not mine',
        proposedSummary: 'x',
        sourceConversationId: 'conv-1',
        sourceMessageId: 'msg-user-1',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('marks the candidate PENDING_CONSENT (not CANDIDATE) when consent currently denies the type', async () => {
    const prisma = makePrismaMock();
    const service = new MemoryCandidateService(prisma as never, makeConsentMock(false), makeAuditMock());

    const candidate = await service.propose(OWNER, {
      proposedType: 'HEALTH',
      proposedTitle: 'x',
      proposedSummary: 'x',
      sourceConversationId: 'conv-1',
      sourceMessageId: 'msg-user-1',
    });

    expect(candidate.status).toBe('PENDING_CONSENT');
  });

  it('accept() creates exactly one Memory and one MemoryVersion', async () => {
    const prisma = makePrismaMock();
    const service = new MemoryCandidateService(prisma as never, makeConsentMock(), makeAuditMock());
    const candidate = await service.propose(OWNER, {
      proposedType: 'GOAL',
      proposedTitle: 'New job',
      proposedSummary: 'Starting a new job',
      sourceConversationId: 'conv-1',
      sourceMessageId: 'msg-user-1',
    });

    const result = await service.accept(OWNER, candidate.id);

    expect(result.memory.status).toBe('ACCEPTED');
    expect(prisma._memories.size).toBe(1);
    expect(prisma._versions).toHaveLength(1);
    expect(result.candidate.status).toBe('ACCEPTED');
    expect(result.candidate.resultingMemoryId).toBe(result.memory.id);
  });

  it('accept() is idempotent — accepting twice does not create a second Memory', async () => {
    const prisma = makePrismaMock();
    const service = new MemoryCandidateService(prisma as never, makeConsentMock(), makeAuditMock());
    const candidate = await service.propose(OWNER, {
      proposedType: 'GOAL',
      proposedTitle: 'New job',
      proposedSummary: 'Starting a new job',
      sourceConversationId: 'conv-1',
      sourceMessageId: 'msg-user-1',
    });

    const first = await service.accept(OWNER, candidate.id);
    const second = await service.accept(OWNER, candidate.id);

    expect(prisma._memories.size).toBe(1);
    expect(second.memory.id).toBe(first.memory.id);
  });

  it('accept() rejects when consent denies the proposed type', async () => {
    const prisma = makePrismaMock();
    const proposingService = new MemoryCandidateService(prisma as never, makeConsentMock(true), makeAuditMock());
    const candidate = await proposingService.propose(OWNER, {
      proposedType: 'WORK',
      proposedTitle: 'x',
      proposedSummary: 'x',
      sourceConversationId: 'conv-1',
      sourceMessageId: 'msg-user-1',
    });

    const denyingService = new MemoryCandidateService(prisma as never, makeConsentMock(false), makeAuditMock());
    await expect(denyingService.accept(OWNER, candidate.id)).rejects.toThrow(ForbiddenException);
    expect(prisma._memories.size).toBe(0);
  });

  it('accept() rejects a candidate belonging to another user (404, not 403)', async () => {
    const prisma = makePrismaMock();
    const service = new MemoryCandidateService(prisma as never, makeConsentMock(), makeAuditMock());
    const candidate = await service.propose(OWNER, {
      proposedType: 'GOAL',
      proposedTitle: 'x',
      proposedSummary: 'x',
      sourceConversationId: 'conv-1',
      sourceMessageId: 'msg-user-1',
    });

    await expect(service.accept(OTHER, candidate.id)).rejects.toThrow(NotFoundException);
  });

  it('reject() creates no Memory and is idempotent', async () => {
    const prisma = makePrismaMock();
    const service = new MemoryCandidateService(prisma as never, makeConsentMock(), makeAuditMock());
    const candidate = await service.propose(OWNER, {
      proposedType: 'GOAL',
      proposedTitle: 'x',
      proposedSummary: 'x',
      sourceConversationId: 'conv-1',
      sourceMessageId: 'msg-user-1',
    });

    const first = await service.reject(OWNER, candidate.id);
    const second = await service.reject(OWNER, candidate.id);

    expect(first.status).toBe('REJECTED');
    expect(second.status).toBe('REJECTED');
    expect(prisma._memories.size).toBe(0);
  });

  it('reject() refuses to reject an already-accepted candidate', async () => {
    const prisma = makePrismaMock();
    const service = new MemoryCandidateService(prisma as never, makeConsentMock(), makeAuditMock());
    const candidate = await service.propose(OWNER, {
      proposedType: 'GOAL',
      proposedTitle: 'x',
      proposedSummary: 'x',
      sourceConversationId: 'conv-1',
      sourceMessageId: 'msg-user-1',
    });
    await service.accept(OWNER, candidate.id);

    await expect(service.reject(OWNER, candidate.id)).rejects.toThrow(ConflictException);
  });
});
