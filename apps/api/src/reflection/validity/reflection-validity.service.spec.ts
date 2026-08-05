import { ReflectionValidityService } from './reflection-validity.service';
import type { PrismaService } from '../../prisma/prisma.service';
import type { MemoryConsentService } from '../../memory/consent/memory-consent.service';

const OWNER = 'user-1';

function makeCandidate(id: string, sources: { sourceType: string; sourceId: string }[], state = 'READY') {
  return { id, userId: OWNER, state, sources };
}

interface IdInFilter {
  id: { in: string[] };
}

interface MemoryRow {
  id: string;
  type: string;
}

function makePrisma(candidates: ReturnType<typeof makeCandidate>[], memories: MemoryRow[], journals: { id: string; state: string }[]) {
  return {
    reflectionCandidate: {
      findMany: jest.fn(async () => candidates),
      updateMany: jest.fn(async (args: { where: IdInFilter; data: Record<string, unknown> }) => ({ count: args.where.id.in.length })),
    },
    memory: {
      findMany: jest.fn(async ({ where }: { where: IdInFilter }) => memories.filter((m) => where.id.in.includes(m.id))),
    },
    journalEntry: {
      findMany: jest.fn(async ({ where }: { where: IdInFilter }) => journals.filter((j) => where.id.in.includes(j.id))),
    },
  };
}

/** Defaults every type to allowed unless explicitly listed as denied — keeps existing tests
 * (written before consent re-checking existed) accurate without needing to opt in everywhere. */
function makeMemoryConsent(deniedTypes: string[] = []) {
  return {
    canAccept: jest.fn(async (_userId: string, type: string) => ({ allowed: !deniedTypes.includes(type), mode: 'ALLOW_SELECTED' as const })),
  };
}

describe('ReflectionValidityService', () => {
  it('does nothing when every cited source still exists, is not deleted, and is still consented', async () => {
    const candidates = [makeCandidate('r1', [{ sourceType: 'MEMORY', sourceId: 'm1' }, { sourceType: 'JOURNAL', sourceId: 'j1' }])];
    const prisma = makePrisma(candidates, [{ id: 'm1', type: 'GOAL' }], [{ id: 'j1', state: 'PUBLISHED' }]);
    const service = new ReflectionValidityService(prisma as unknown as PrismaService, makeMemoryConsent() as unknown as MemoryConsentService);

    await service.revalidateForUser(OWNER);

    expect(prisma.reflectionCandidate.updateMany).not.toHaveBeenCalled();
  });

  it('expires a candidate whose cited Memory no longer exists (hard-deleted)', async () => {
    const candidates = [makeCandidate('r1', [{ sourceType: 'MEMORY', sourceId: 'm1' }])];
    const prisma = makePrisma(candidates, [], []);
    const service = new ReflectionValidityService(prisma as unknown as PrismaService, makeMemoryConsent() as unknown as MemoryConsentService);

    await service.revalidateForUser(OWNER);

    expect(prisma.reflectionCandidate.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: { in: ['r1'] } }, data: expect.objectContaining({ state: 'EXPIRED' }) }),
    );
  });

  it('expires a candidate whose cited Memory type consent has since been revoked (DENY_TYPE/DISABLED)', async () => {
    const candidates = [makeCandidate('r1', [{ sourceType: 'MEMORY', sourceId: 'm1' }])];
    const prisma = makePrisma(candidates, [{ id: 'm1', type: 'HEALTH' }], []);
    const memoryConsent = makeMemoryConsent(['HEALTH']);
    const service = new ReflectionValidityService(prisma as unknown as PrismaService, memoryConsent as unknown as MemoryConsentService);

    await service.revalidateForUser(OWNER);

    expect(memoryConsent.canAccept).toHaveBeenCalledWith(OWNER, 'HEALTH');
    expect(prisma.reflectionCandidate.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: { in: ['r1'] } }, data: expect.objectContaining({ state: 'EXPIRED' }) }),
    );
  });

  it('expires a candidate whose cited Journal entry was soft-deleted', async () => {
    const candidates = [makeCandidate('r1', [{ sourceType: 'JOURNAL', sourceId: 'j1' }])];
    const prisma = makePrisma(candidates, [], [{ id: 'j1', state: 'DELETED' }]);
    const service = new ReflectionValidityService(prisma as unknown as PrismaService, makeMemoryConsent() as unknown as MemoryConsentService);

    await service.revalidateForUser(OWNER);

    expect(prisma.reflectionCandidate.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: { in: ['r1'] } } }),
    );
  });

  it('leaves ACTIVITY/COMPANION-only candidates untouched — no deletion or consent pathway exists for those sources', async () => {
    const candidates = [makeCandidate('r1', [{ sourceType: 'ACTIVITY', sourceId: 'a1' }, { sourceType: 'COMPANION', sourceId: 'c1' }])];
    const prisma = makePrisma(candidates, [], []);
    const service = new ReflectionValidityService(prisma as unknown as PrismaService, makeMemoryConsent() as unknown as MemoryConsentService);

    await service.revalidateForUser(OWNER);

    expect(prisma.reflectionCandidate.updateMany).not.toHaveBeenCalled();
  });
});
