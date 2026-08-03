import { MemoryConsentService } from './memory-consent.service';
import type { MemoryAuditService } from '../audit/memory-audit.service';

function makePrismaMock() {
  const settings = new Map<string, { userId: string; mode: string }>();
  const overrides = new Map<string, { userId: string; type: string; mode: string }>();
  const key = (userId: string, type: string) => `${userId}:${type}`;

  return {
    memoryConsentSetting: {
      findUnique: jest.fn(async ({ where: { userId } }: { where: { userId: string } }) => settings.get(userId) ?? null),
      upsert: jest.fn(async ({ where: { userId }, create, update }: { where: { userId: string }; create: { userId: string; mode: string }; update: { mode?: string } }) => {
        const existing = settings.get(userId);
        const record = existing ? { ...existing, ...update } : { ...create };
        settings.set(userId, record);
        return record;
      }),
    },
    memoryTypeConsent: {
      findUnique: jest.fn(async ({ where: { userId_type } }: { where: { userId_type: { userId: string; type: string } } }) =>
        overrides.get(key(userId_type.userId, userId_type.type)) ?? null,
      ),
      findMany: jest.fn(async ({ where: { userId } }: { where: { userId: string } }) =>
        [...overrides.values()].filter((o) => o.userId === userId),
      ),
      upsert: jest.fn(
        async ({
          where: { userId_type },
          create,
          update,
        }: {
          where: { userId_type: { userId: string; type: string } };
          create: { userId: string; type: string; mode: string };
          update: { mode: string };
        }) => {
          const k = key(userId_type.userId, userId_type.type);
          const existing = overrides.get(k);
          const record = existing ? { ...existing, ...update } : { ...create };
          overrides.set(k, record);
          return record;
        },
      ),
    },
  };
}

function makeAuditMock(): MemoryAuditService {
  return { record: jest.fn(async () => undefined) } as unknown as MemoryAuditService;
}

describe('MemoryConsentService', () => {
  it('defaults the global mode to the conservative ASK_EVERY_TIME for a brand-new user', async () => {
    const prisma = makePrismaMock();
    const service = new MemoryConsentService(prisma as never, makeAuditMock());

    const summary = await service.getSummary('user-1');

    expect(summary.globalMode).toBe('ASK_EVERY_TIME');
    expect(summary.typeOverrides).toEqual([]);
  });

  it('allows acceptance for an ordinary type under the default global mode', async () => {
    const prisma = makePrismaMock();
    const service = new MemoryConsentService(prisma as never, makeAuditMock());

    const decision = await service.canAccept('user-1', 'GOAL');

    expect(decision.allowed).toBe(true);
  });

  it('blocks acceptance for every type once the global mode is DISABLED', async () => {
    const prisma = makePrismaMock();
    const service = new MemoryConsentService(prisma as never, makeAuditMock());
    await service.updateGlobal('user-1', 'DISABLED');

    const decision = await service.canAccept('user-1', 'GOAL');

    expect(decision).toMatchObject({ allowed: false, reason: 'disabled' });
  });

  it('a per-type DENY_TYPE override blocks acceptance for that type even when the global mode allows', async () => {
    const prisma = makePrismaMock();
    const service = new MemoryConsentService(prisma as never, makeAuditMock());
    await service.updateGlobal('user-1', 'ALLOW_SELECTED');
    await service.updateType('user-1', 'WORK', 'DENY_TYPE');

    expect((await service.canAccept('user-1', 'WORK')).allowed).toBe(false);
    expect((await service.canAccept('user-1', 'GOAL')).allowed).toBe(true);
  });

  it('a per-type ALLOW_TYPE override allows acceptance even when the global mode is DENY_TYPE', async () => {
    const prisma = makePrismaMock();
    const service = new MemoryConsentService(prisma as never, makeAuditMock());
    await service.updateGlobal('user-1', 'DENY_TYPE');
    await service.updateType('user-1', 'INTEREST', 'ALLOW_TYPE');

    expect((await service.canAccept('user-1', 'INTEREST')).allowed).toBe(true);
    expect((await service.canAccept('user-1', 'GOAL')).allowed).toBe(false);
  });

  describe('HEALTH — never auto-allowed, never falls back to the global default', () => {
    it('blocks HEALTH even when the global mode is ALLOW_TYPE', async () => {
      const prisma = makePrismaMock();
      const service = new MemoryConsentService(prisma as never, makeAuditMock());
      await service.updateGlobal('user-1', 'ALLOW_TYPE');

      const decision = await service.canAccept('user-1', 'HEALTH');

      expect(decision).toMatchObject({ allowed: false, reason: 'health_requires_explicit_consent' });
    });

    it('allows HEALTH only once an explicit per-type ALLOW_TYPE override exists', async () => {
      const prisma = makePrismaMock();
      const service = new MemoryConsentService(prisma as never, makeAuditMock());
      await service.updateType('user-1', 'HEALTH', 'ALLOW_TYPE');

      expect((await service.canAccept('user-1', 'HEALTH')).allowed).toBe(true);
    });

    it('a HEALTH override of ALLOW_SELECTED (not ALLOW_TYPE) still blocks — only ALLOW_TYPE counts', async () => {
      const prisma = makePrismaMock();
      const service = new MemoryConsentService(prisma as never, makeAuditMock());
      await service.updateType('user-1', 'HEALTH', 'ALLOW_SELECTED');

      expect((await service.canAccept('user-1', 'HEALTH')).allowed).toBe(false);
    });
  });

  it('tracks each user’s consent independently', async () => {
    const prisma = makePrismaMock();
    const service = new MemoryConsentService(prisma as never, makeAuditMock());
    await service.updateGlobal('user-1', 'DISABLED');

    expect((await service.canAccept('user-1', 'GOAL')).allowed).toBe(false);
    expect((await service.canAccept('user-2', 'GOAL')).allowed).toBe(true);
  });

  it('records a CONSENT_CHANGED audit entry for both global and per-type updates', async () => {
    const prisma = makePrismaMock();
    const audit = makeAuditMock();
    const service = new MemoryConsentService(prisma as never, audit);

    await service.updateGlobal('user-1', 'ALLOW_TYPE');
    await service.updateType('user-1', 'GOAL', 'ALLOW_TYPE');

    expect(audit.record).toHaveBeenCalledTimes(2);
    expect(audit.record).toHaveBeenCalledWith(expect.objectContaining({ action: 'CONSENT_CHANGED', userId: 'user-1' }));
  });
});
