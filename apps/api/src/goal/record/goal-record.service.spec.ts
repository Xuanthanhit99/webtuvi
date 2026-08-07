import { BadRequestException, NotFoundException } from '@nestjs/common';
import { GoalRecordService } from './goal-record.service';
import type { GoalProgressEngineService } from '../progress/goal-progress-engine.service';

const OWNER = 'user-1';
const OTHER = 'user-2';

interface GoalOverrides {
  id?: string;
  userId?: string;
  status?: string;
  previousStatus?: string | null;
  type?: string;
}

function makeGoal(overrides: GoalOverrides = {}) {
  return {
    id: overrides.id ?? 'goal-1',
    userId: overrides.userId ?? OWNER,
    title: 'Learn Spanish',
    description: '',
    category: 'LEARNING',
    type: overrides.type ?? 'MILESTONE_BASED',
    difficulty: 'MEDIUM',
    status: overrides.status ?? 'ACTIVE',
    previousStatus: overrides.previousStatus ?? null,
    visibility: 'PRIVATE',
    linkedTag: 'spanish',
    targetValue: null,
    targetUnit: null,
    targetDate: null,
    startedAt: new Date('2026-01-01T00:00:00.000Z'),
    completedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    archivedAt: null,
    deletedAt: null,
    milestones: [] as unknown[],
    progress: null as unknown,
  };
}

type Row = ReturnType<typeof makeGoal>;

function matchesWhere(row: Row, where: Record<string, unknown>): boolean {
  if (where.userId && row.userId !== where.userId) return false;
  if (where.status) {
    const status = where.status as string | { notIn?: string[] };
    if (typeof status === 'object' && status.notIn) {
      if (status.notIn.includes(row.status)) return false;
    } else if (row.status !== status) return false;
  }
  if (where.category && row.category !== where.category) return false;
  return true;
}

function makePrismaMock(seed: Row[] = []) {
  const rows = new Map(seed.map((r) => [r.id, r]));
  const history: { id: string; goalId: string; action: string; detail: string; createdAt: Date }[] = [];
  let historyIdCounter = 0;

  return {
    goal: {
      findUnique: jest.fn(async ({ where: { id } }: { where: { id: string } }) => rows.get(id) ?? null),
      findUniqueOrThrow: jest.fn(async ({ where: { id } }: { where: { id: string } }) => {
        const row = rows.get(id);
        if (!row) throw new Error('not found');
        return row;
      }),
      findMany: jest.fn(async ({ where, skip, take }: { where: Record<string, unknown>; skip?: number; take?: number }) => {
        let matched = [...rows.values()].filter((row) => matchesWhere(row, where));
        if (skip !== undefined) matched = matched.slice(skip);
        if (take !== undefined) matched = matched.slice(0, take);
        return matched;
      }),
      count: jest.fn(async ({ where }: { where: Record<string, unknown> }) => [...rows.values()].filter((row) => matchesWhere(row, where)).length),
      create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
        const row = makeGoal({ id: `goal-${rows.size + 1}` });
        const created = { ...row, ...data };
        rows.set(created.id, created);
        return created;
      }),
      update: jest.fn(async ({ where: { id }, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        const existing = rows.get(id)!;
        const updated = { ...existing, ...data };
        rows.set(id, updated);
        return updated;
      }),
    },
    goalHistory: {
      create: jest.fn(async ({ data }: { data: { goalId: string; action: string; detail: string } }) => {
        const entry = { id: `h${historyIdCounter++}`, ...data, createdAt: new Date() };
        history.push(entry);
        return entry;
      }),
      findMany: jest.fn(async ({ where: { goalId } }: { where: { goalId: string } }) => history.filter((h) => h.goalId === goalId)),
    },
  };
}

function makeService(seed: Row[] = []) {
  const prisma = makePrismaMock(seed);
  const progressEngine = { ensureComputed: jest.fn().mockResolvedValue(undefined) } as unknown as GoalProgressEngineService;
  const service = new GoalRecordService(prisma as never, progressEngine);
  return { service, prisma };
}

describe('GoalRecordService — ownership', () => {
  it('getOne 404s identically for a nonexistent id and another user’s goal', async () => {
    const { service } = makeService([makeGoal({ id: 'g1', userId: OTHER })]);
    await expect(service.getOne(OWNER, 'g1')).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.getOne(OWNER, 'does-not-exist')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('pause/archive/remove are all ownership-scoped', async () => {
    const { service } = makeService([makeGoal({ id: 'g1', userId: OTHER })]);
    await expect(service.pause(OWNER, 'g1')).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.archive(OWNER, 'g1')).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.remove(OWNER, 'g1')).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('GoalRecordService — status transitions', () => {
  it('pause only succeeds from ACTIVE', async () => {
    const { service } = makeService([makeGoal({ id: 'g1', status: 'ACTIVE' })]);
    const result = await service.pause(OWNER, 'g1');
    expect(result.status).toBe('PAUSED');
  });

  it('pause rejects a goal that is already PAUSED', async () => {
    const { service } = makeService([makeGoal({ id: 'g1', status: 'PAUSED' })]);
    await expect(service.pause(OWNER, 'g1')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('resume only succeeds from PAUSED', async () => {
    const { service } = makeService([makeGoal({ id: 'g1', status: 'PAUSED' })]);
    const result = await service.resume(OWNER, 'g1');
    expect(result.status).toBe('ACTIVE');
  });

  it('complete is rejected once a goal is already ARCHIVED', async () => {
    const { service } = makeService([makeGoal({ id: 'g1', status: 'ARCHIVED' })]);
    await expect(service.complete(OWNER, 'g1')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('archive is reversible via restore, returning to the exact prior status', async () => {
    const { service } = makeService([makeGoal({ id: 'g1', status: 'PAUSED' })]);
    const archived = await service.archive(OWNER, 'g1');
    expect(archived.status).toBe('ARCHIVED');

    const restored = await service.restore(OWNER, 'g1');
    expect(restored.status).toBe('PAUSED');
  });

  it('delete is reversible via restore, returning to the exact prior status', async () => {
    const { service } = makeService([makeGoal({ id: 'g1', status: 'ACTIVE' })]);
    const deleted = await service.remove(OWNER, 'g1');
    expect(deleted.status).toBe('DELETED');

    const restored = await service.restore(OWNER, 'g1');
    expect(restored.status).toBe('ACTIVE');
  });

  it('restore is rejected on a goal that is neither ARCHIVED nor DELETED', async () => {
    const { service } = makeService([makeGoal({ id: 'g1', status: 'ACTIVE' })]);
    await expect(service.restore(OWNER, 'g1')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('every transition writes a real GoalHistory entry', async () => {
    const { service } = makeService([makeGoal({ id: 'g1', status: 'ACTIVE' })]);
    await service.pause(OWNER, 'g1');
    const history = await service.history(OWNER, 'g1');
    expect(history.some((h) => h.action === 'PAUSED')).toBe(true);
  });
});

describe('GoalRecordService — create', () => {
  it('requires a target value for METRIC_BASED goals', async () => {
    const { service } = makeService();
    await expect(
      service.create(OWNER, {
        title: 'Read books',
        category: 'LEARNING',
        type: 'METRIC_BASED',
        linkedTag: 'reading',
      } as never),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('GoalRecordService — list filters', () => {
  it('excludes ARCHIVED and DELETED goals by default', async () => {
    const { service } = makeService([
      makeGoal({ id: 'g-active', status: 'ACTIVE' }),
      makeGoal({ id: 'g-archived', status: 'ARCHIVED' }),
      makeGoal({ id: 'g-deleted', status: 'DELETED' }),
    ]);
    const result = await service.list(OWNER, {});
    expect(result.items.map((g) => g.id)).toEqual(['g-active']);
  });

  it('an explicit status filter overrides the default exclusion', async () => {
    const { service } = makeService([makeGoal({ id: 'g-archived', status: 'ARCHIVED' })]);
    const result = await service.list(OWNER, { status: 'ARCHIVED' });
    expect(result.items.map((g) => g.id)).toEqual(['g-archived']);
  });

  it('never returns another user’s goals', async () => {
    const { service } = makeService([makeGoal({ id: 'mine', userId: OWNER }), makeGoal({ id: 'theirs', userId: OTHER })]);
    const result = await service.list(OWNER, {});
    expect(result.items.map((g) => g.id)).toEqual(['mine']);
  });
});
