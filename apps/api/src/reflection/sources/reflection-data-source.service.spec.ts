import { ReflectionDataSourceService } from './reflection-data-source.service';
import type { PrismaService } from '../../prisma/prisma.service';
import type { MemoryConflictService } from '../../memory/conflict/memory-conflict.service';
import type { MemoryConsentService } from '../../memory/consent/memory-consent.service';
import { makeMemory } from '../test-fixtures';

const OWNER = 'user-1';

function makePrisma(memories: ReturnType<typeof makeMemory>[]) {
  return {
    journalEntry: { findMany: jest.fn(async () => []) },
    memory: { findMany: jest.fn(async () => memories) },
    activityEvent: { findMany: jest.fn(async () => []) },
    conversationMessage: { findMany: jest.fn(async () => []) },
  };
}

function makeMemoryConflicts() {
  return { detectForUser: jest.fn(async () => []) };
}

function makeMemoryConsent(deniedTypes: string[] = []) {
  return {
    canAccept: jest.fn(async (_userId: string, type: string) => ({ allowed: !deniedTypes.includes(type), mode: 'ALLOW_SELECTED' as const })),
  };
}

describe('ReflectionDataSourceService — consent re-check', () => {
  it('includes an ACCEPTED memory whose type is currently consented', async () => {
    const memories = [makeMemory({ id: 'm1', type: 'GOAL' })];
    const prisma = makePrisma(memories);
    const service = new ReflectionDataSourceService(
      prisma as unknown as PrismaService,
      makeMemoryConflicts() as unknown as MemoryConflictService,
      makeMemoryConsent() as unknown as MemoryConsentService,
    );

    const data = await service.fetch(OWNER);

    expect(data.memories.map((m) => m.id)).toEqual(['m1']);
  });

  it('excludes an ACCEPTED memory whose type consent has since been revoked (DENY_TYPE/DISABLED)', async () => {
    const memories = [makeMemory({ id: 'm1', type: 'HEALTH' }), makeMemory({ id: 'm2', type: 'GOAL' })];
    const prisma = makePrisma(memories);
    const memoryConsent = makeMemoryConsent(['HEALTH']);
    const service = new ReflectionDataSourceService(
      prisma as unknown as PrismaService,
      makeMemoryConflicts() as unknown as MemoryConflictService,
      memoryConsent as unknown as MemoryConsentService,
    );

    const data = await service.fetch(OWNER);

    expect(data.memories.map((m) => m.id)).toEqual(['m2']);
    expect(memoryConsent.canAccept).toHaveBeenCalledWith(OWNER, 'HEALTH');
    expect(memoryConsent.canAccept).toHaveBeenCalledWith(OWNER, 'GOAL');
  });

  it('a consent-denied goal memory is also excluded from goalMemories', async () => {
    const memories = [makeMemory({ id: 'm1', type: 'GOAL' })];
    const prisma = makePrisma(memories);
    const memoryConsent = makeMemoryConsent(['GOAL']);
    const service = new ReflectionDataSourceService(
      prisma as unknown as PrismaService,
      makeMemoryConflicts() as unknown as MemoryConflictService,
      memoryConsent as unknown as MemoryConsentService,
    );

    const data = await service.fetch(OWNER);

    expect(data.memories).toEqual([]);
    expect(data.goalMemories).toEqual([]);
  });

  it('calls canAccept once per distinct type, not once per memory row', async () => {
    const memories = [makeMemory({ id: 'm1', type: 'GOAL' }), makeMemory({ id: 'm2', type: 'GOAL' }), makeMemory({ id: 'm3', type: 'GOAL' })];
    const prisma = makePrisma(memories);
    const memoryConsent = makeMemoryConsent();
    const service = new ReflectionDataSourceService(
      prisma as unknown as PrismaService,
      makeMemoryConflicts() as unknown as MemoryConflictService,
      memoryConsent as unknown as MemoryConsentService,
    );

    await service.fetch(OWNER);

    expect(memoryConsent.canAccept).toHaveBeenCalledTimes(1);
  });
});
