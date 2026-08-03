import { ConflictException, NotFoundException } from '@nestjs/common';
import { MemoryExportService } from './memory-export.service';
import type { MemoryConsentService } from '../consent/memory-consent.service';
import type { MemoryAuditService } from '../audit/memory-audit.service';

function makePrismaMock() {
  return {
    memory: {
      findMany: jest.fn(async () => [
        {
          id: 'mem-1',
          userId: 'user-1',
          type: 'GOAL',
          title: 'Title',
          summary: 'Summary',
          structuredPayload: null,
          status: 'ACCEPTED',
          consentState: 'ALLOW_SELECTED',
          visibility: 'PRIVATE',
          sourceType: 'USER_EXPLICIT',
          sourceConversationId: 'conv-1',
          sourceMessageId: 'msg-1',
          version: 1,
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date('2026-01-01T00:00:00.000Z'),
          archivedAt: null,
        },
      ]),
    },
    memoryVersion: {
      findMany: jest.fn(async () => [
        {
          memoryId: 'mem-1',
          version: 1,
          title: 'Title',
          summary: 'Summary',
          visibility: 'PRIVATE',
          changeReason: 'created',
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
        },
      ]),
    },
  };
}

function makeRedisMock() {
  const store = new Map<string, string>();
  return {
    client: {
      // Honors real NX semantics: returns null (not 'OK') if the key already exists.
      set: jest.fn(async (key: string, value: string, ...rest: unknown[]) => {
        const isNx = rest.includes('NX');
        if (isNx && store.has(key)) return null;
        store.set(key, value);
        return 'OK';
      }),
      get: jest.fn(async (key: string) => store.get(key) ?? null),
      del: jest.fn(async (key: string) => {
        const existed = store.delete(key);
        return existed ? 1 : 0;
      }),
    },
  };
}

function makeConsentMock(): MemoryConsentService {
  return { getSummary: jest.fn(async () => ({ globalMode: 'ASK_EVERY_TIME', typeOverrides: [] })) } as unknown as MemoryConsentService;
}

function makeAuditMock(): MemoryAuditService {
  return {
    record: jest.fn(async () => undefined),
    recentForUser: jest.fn(async () => [{ id: 'a1', memoryId: 'mem-1', action: 'CREATED', actorType: 'USER', createdAt: '2026-01-01T00:00:00.000Z' }]),
  } as unknown as MemoryAuditService;
}

describe('MemoryExportService', () => {
  it('includes only the caller’s own memories, versions, consent, and activity history', async () => {
    const prisma = makePrismaMock();
    const redis = makeRedisMock();
    const service = new MemoryExportService(prisma as never, redis as never, makeConsentMock(), makeAuditMock());

    const job = await service.createExport('user-1');

    expect(job.status).toBe('completed');
    expect(job.result.memories).toHaveLength(1);
    expect(job.result.versions).toHaveLength(1);
    expect(job.result.consent.globalMode).toBe('ASK_EVERY_TIME');
    expect(job.result.activityHistory).toHaveLength(1);
    expect(prisma.memory.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 'user-1', status: { not: 'DELETED' } } }));
  });

  it('excludes deleted memories from the export', async () => {
    const prisma = makePrismaMock();
    const redis = makeRedisMock();
    const service = new MemoryExportService(prisma as never, redis as never, makeConsentMock(), makeAuditMock());

    await service.createExport('user-1');

    const call = (prisma.memory.findMany as jest.Mock).mock.calls[0][0];
    expect(call.where.status).toEqual({ not: 'DELETED' });
  });

  it('records an EXPORTED audit entry', async () => {
    const prisma = makePrismaMock();
    const redis = makeRedisMock();
    const audit = makeAuditMock();
    const service = new MemoryExportService(prisma as never, redis as never, makeConsentMock(), audit);

    await service.createExport('user-1');

    expect(audit.record).toHaveBeenCalledWith(expect.objectContaining({ action: 'EXPORTED', userId: 'user-1' }));
  });

  it('getExport retrieves the cached result by job id for the same user', async () => {
    const prisma = makePrismaMock();
    const redis = makeRedisMock();
    const service = new MemoryExportService(prisma as never, redis as never, makeConsentMock(), makeAuditMock());

    const created = await service.createExport('user-1');
    const fetched = await service.getExport('user-1', created.jobId);

    expect(fetched.result).toEqual(created.result);
  });

  it('getExport throws 404 for a job id that does not exist (expired or never created)', async () => {
    const prisma = makePrismaMock();
    const redis = makeRedisMock();
    const service = new MemoryExportService(prisma as never, redis as never, makeConsentMock(), makeAuditMock());

    await expect(service.getExport('user-1', 'does-not-exist')).rejects.toThrow(NotFoundException);
  });

  it('getExport throws 404 for a job id created by a different user (no cross-user export access)', async () => {
    const prisma = makePrismaMock();
    const redis = makeRedisMock();
    const service = new MemoryExportService(prisma as never, redis as never, makeConsentMock(), makeAuditMock());

    const created = await service.createExport('user-1');

    await expect(service.getExport('user-2', created.jobId)).rejects.toThrow(NotFoundException);
  });

  describe('per-user concurrency cap (Sprint 3A release closure — no unbounded concurrent export creation)', () => {
    it('rejects a second concurrent export request for the same user with 409', async () => {
      const prisma = makePrismaMock();
      const redis = makeRedisMock();
      // Simulate "already in progress": pre-acquire the lock exactly as createExport() would.
      await redis.client.set('memory:export:lock:user-1', '1', 'PX', 30_000, 'NX');
      const service = new MemoryExportService(prisma as never, redis as never, makeConsentMock(), makeAuditMock());

      await expect(service.createExport('user-1')).rejects.toThrow(ConflictException);
    });

    it('releases the lock after completion, so a subsequent export succeeds', async () => {
      const prisma = makePrismaMock();
      const redis = makeRedisMock();
      const service = new MemoryExportService(prisma as never, redis as never, makeConsentMock(), makeAuditMock());

      await service.createExport('user-1');
      await expect(service.createExport('user-1')).resolves.toMatchObject({ status: 'completed' });
    });

    it('tracks the lock independently per user', async () => {
      const prisma = makePrismaMock();
      const redis = makeRedisMock();
      await redis.client.set('memory:export:lock:user-1', '1', 'PX', 30_000, 'NX');
      const service = new MemoryExportService(prisma as never, redis as never, makeConsentMock(), makeAuditMock());

      await expect(service.createExport('user-2')).resolves.toMatchObject({ status: 'completed' });
    });

    it('fails open (allows the export) if Redis is unreachable', async () => {
      const prisma = makePrismaMock();
      const redis = { client: { set: jest.fn().mockRejectedValue(new Error('ECONNREFUSED')), get: jest.fn(), del: jest.fn() } };
      const service = new MemoryExportService(prisma as never, redis as never, makeConsentMock(), makeAuditMock());

      await expect(service.createExport('user-1')).resolves.toMatchObject({ status: 'completed' });
    });
  });
});
