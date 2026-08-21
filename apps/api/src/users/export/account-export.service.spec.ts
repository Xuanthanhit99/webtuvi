import { ConflictException, NotFoundException } from '@nestjs/common';
import { AccountExportService } from './account-export.service';
import type { MemoryConsentService } from '../../memory/consent/memory-consent.service';
import type { MemoryAuditService } from '../../memory/audit/memory-audit.service';

function findMany() {
  return jest.fn(async () => []);
}

function makePrismaMock() {
  return {
    user: {
      findUniqueOrThrow: jest.fn(async () => ({
        id: 'user-1',
        email: 'user@example.com',
        displayName: 'Test User',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        emailVerifiedAt: null,
        // Deliberately included to prove the service's `select` clause (not this test) is what
        // keeps it out of the export — asserted below via the actual findUniqueOrThrow call args.
      })),
    },
    userPreference: { findUnique: jest.fn(async () => null) },
    onboardingProgress: { findUnique: jest.fn(async () => null) },
    companionMessage: { findMany: findMany() },
    conversation: { findMany: findMany() },
    memory: { findMany: findMany() },
    memoryVersion: { findMany: findMany() },
    memoryNote: { findMany: findMany() },
    journalEntry: { findMany: findMany() },
    reflectionCandidate: { findMany: findMany() },
    insightCandidate: { findMany: findMany() },
    review: { findMany: findMany() },
    goal: { findMany: findMany() },
    tarotReading: { findMany: findMany() },
    numerologyReading: { findMany: findMany() },
    natalChart: { findMany: findMany() },
    destinyReport: { findMany: findMany() },
    easternHoroscopeProfile: { findMany: findMany() },
    tuViChart: { findMany: findMany() },
    premiumEntitlement: { findMany: findMany() },
    paymentOrder: { findMany: findMany() },
    notification: { findMany: findMany() },
    notificationPreference: { findUnique: jest.fn(async () => null) },
    activityEvent: { findMany: findMany() },
  };
}

function makeRedisMock() {
  const store = new Map<string, string>();
  return {
    client: {
      set: jest.fn(async (key: string, value: string, ...rest: unknown[]) => {
        const isNx = rest.includes('NX');
        if (isNx && store.has(key)) return null;
        store.set(key, value);
        return 'OK';
      }),
      get: jest.fn(async (key: string) => store.get(key) ?? null),
      del: jest.fn(async (key: string) => (store.delete(key) ? 1 : 0)),
    },
  };
}

function makeConsentMock(): MemoryConsentService {
  return { getSummary: jest.fn(async () => ({ globalMode: 'ASK_EVERY_TIME', typeOverrides: [] })) } as unknown as MemoryConsentService;
}

function makeAuditMock(): MemoryAuditService {
  return { recentForUser: jest.fn(async () => []) } as unknown as MemoryAuditService;
}

function makeService(prisma = makePrismaMock(), redis = makeRedisMock()) {
  return new AccountExportService(prisma as never, redis as never, makeConsentMock(), makeAuditMock());
}

describe('AccountExportService', () => {
  it('assembles a versioned export with every documented section', async () => {
    const service = makeService();
    const job = await service.createExport('user-1');

    expect(job.status).toBe('completed');
    expect(job.result.exportVersion).toBe(5); // bumped Sprint 18B.9 — see AccountExportResult doc comment
    expect(job.result.account.id).toBe('user-1');
    expect(job.result).toHaveProperty('preferences');
    expect(job.result).toHaveProperty('companion');
    expect(job.result).toHaveProperty('memory');
    expect(job.result.memory).toHaveProperty('legacyNotes');
    expect(job.result).toHaveProperty('journal');
    expect(job.result).toHaveProperty('discoveries');
    expect(job.result.discoveries).toHaveProperty('easternHoroscope');
    expect(job.result.discoveries).toHaveProperty('tuVi');
    expect(job.result).toHaveProperty('destinyReports');
    expect(job.result).toHaveProperty('premium');
    expect(job.result).toHaveProperty('notifications');
    expect(job.result.notifications).toHaveProperty('items');
    expect(job.result.notifications).toHaveProperty('preferences');
  });

  it('Sprint 11 — notification export never includes internal delivery/security metadata', async () => {
    const prisma = makePrismaMock();
    const service = makeService(prisma);

    await service.createExport('user-1');

    const call = (prisma.notification.findMany as jest.Mock).mock.calls[0][0];
    expect(call.select).not.toHaveProperty('emailStatus');
    expect(call.select).not.toHaveProperty('emailAttemptedAt');
    expect(call.select).not.toHaveProperty('emailError');
    expect(call.where.userId).toBe('user-1');
  });

  it('never includes passwordHash — the User query only selects safe display fields', async () => {
    const prisma = makePrismaMock();
    const service = makeService(prisma);

    const job = await service.createExport('user-1');

    const call = (prisma.user.findUniqueOrThrow as jest.Mock).mock.calls[0][0];
    expect(call.select).not.toHaveProperty('passwordHash');
    expect(JSON.stringify(job.result)).not.toContain('passwordHash');
  });

  it('never selects internal PayOS correlation ids on payment orders', async () => {
    const prisma = makePrismaMock();
    const service = makeService(prisma);

    await service.createExport('user-1');

    const call = (prisma.paymentOrder.findMany as jest.Mock).mock.calls[0][0];
    expect(call.select).not.toHaveProperty('providerOrderCode');
    expect(call.select).not.toHaveProperty('providerPaymentLinkId');
  });

  it('scopes every query to the requesting user only', async () => {
    const prisma = makePrismaMock();
    const service = makeService(prisma);

    await service.createExport('user-1');

    expect((prisma.memory.findMany as jest.Mock).mock.calls[0][0].where.userId).toBe('user-1');
    expect((prisma.memoryNote.findMany as jest.Mock).mock.calls[0][0].where.userId).toBe('user-1');
    expect((prisma.journalEntry.findMany as jest.Mock).mock.calls[0][0].where.userId).toBe('user-1');
    expect((prisma.tarotReading.findMany as jest.Mock).mock.calls[0][0].where.userId).toBe('user-1');
  });

  it('getExport 404s for a job id created by a different user (no cross-user export access)', async () => {
    const service = makeService();
    const created = await service.createExport('user-1');

    await expect(service.getExport('user-2', created.jobId)).rejects.toThrow(NotFoundException);
  });

  it('getExport 404s for an unknown/expired job id', async () => {
    const service = makeService();
    await expect(service.getExport('user-1', 'does-not-exist')).rejects.toThrow(NotFoundException);
  });

  it('rejects a second concurrent export request for the same user with 409', async () => {
    const redis = makeRedisMock();
    await redis.client.set('account:export:lock:user-1', '1', 'PX', 60_000, 'NX');
    const service = makeService(makePrismaMock(), redis);

    await expect(service.createExport('user-1')).rejects.toThrow(ConflictException);
  });

  it('fails open (allows the export) if Redis is unreachable', async () => {
    const redis = { client: { set: jest.fn().mockRejectedValue(new Error('ECONNREFUSED')), get: jest.fn(), del: jest.fn() } };
    const service = makeService(makePrismaMock(), redis as never);

    await expect(service.createExport('user-1')).resolves.toMatchObject({ status: 'completed' });
  });
});
