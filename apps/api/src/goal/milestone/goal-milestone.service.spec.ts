import { BadRequestException, NotFoundException } from '@nestjs/common';
import { GoalMilestoneService } from './goal-milestone.service';

const OWNER = 'user-1';
const OTHER = 'user-2';

function makeGoalRow(overrides: { id?: string; userId?: string } = {}) {
  return { id: overrides.id ?? 'goal-1', userId: overrides.userId ?? OWNER };
}

function makeMilestoneRow(overrides: { id?: string; goalId?: string; type?: string; status?: string; targetCount?: number | null } = {}) {
  return {
    id: overrides.id ?? 'm1',
    goalId: overrides.goalId ?? 'g1',
    title: 'Complete 10 lessons',
    description: '',
    type: overrides.type ?? 'MANUAL',
    status: overrides.status ?? 'PENDING',
    order: 0,
    targetCount: overrides.targetCount ?? null,
    dueDate: null,
    completedAt: null,
    failedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function makeService(goals: ReturnType<typeof makeGoalRow>[] = [], milestones: ReturnType<typeof makeMilestoneRow>[] = []) {
  const goalRows = new Map(goals.map((g) => [g.id, g]));
  const milestoneRows = new Map(milestones.map((m) => [m.id, m]));

  const prisma = {
    goal: { findUnique: jest.fn(async ({ where: { id } }: { where: { id: string } }) => goalRows.get(id) ?? null) },
    goalMilestone: {
      aggregate: jest.fn(async () => ({ _max: { order: null } })),
      create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
        const row = { ...makeMilestoneRow(), ...data, id: `m${milestoneRows.size + 1}` };
        milestoneRows.set(row.id, row);
        return row;
      }),
      findUnique: jest.fn(async ({ where: { id } }: { where: { id: string } }) => milestoneRows.get(id) ?? null),
      update: jest.fn(async ({ where: { id }, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        const existing = milestoneRows.get(id)!;
        const updated = { ...existing, ...data };
        milestoneRows.set(id, updated);
        return updated;
      }),
    },
    goalHistory: { create: jest.fn(async () => ({})) },
  };

  return { service: new GoalMilestoneService(prisma as never), prisma };
}

describe('GoalMilestoneService — ownership', () => {
  it('create 404s for a goal owned by another user', async () => {
    const { service } = makeService([makeGoalRow({ id: 'g1', userId: OTHER })]);
    await expect(service.create(OWNER, 'g1', { title: 'x', type: 'MANUAL' } as never)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('complete 404s for a milestone under a goal owned by another user', async () => {
    const { service } = makeService([makeGoalRow({ id: 'g1', userId: OTHER })], [makeMilestoneRow({ id: 'm1', goalId: 'g1' })]);
    await expect(service.complete(OWNER, 'g1', 'm1')).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('GoalMilestoneService — creation', () => {
  it('requires a target count for AUTOMATIC milestones', async () => {
    const { service } = makeService([makeGoalRow({ id: 'g1' })]);
    await expect(service.create(OWNER, 'g1', { title: 'x', type: 'AUTOMATIC' } as never)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('accepts an AUTOMATIC milestone with a target count', async () => {
    const { service } = makeService([makeGoalRow({ id: 'g1' })]);
    const milestone = await service.create(OWNER, 'g1', { title: 'x', type: 'AUTOMATIC', targetCount: 5 } as never);
    expect(milestone.type).toBe('AUTOMATIC');
    expect(milestone.targetCount).toBe(5);
  });
});

describe('GoalMilestoneService — manual completion', () => {
  it('completes a PENDING MANUAL milestone', async () => {
    const { service } = makeService([makeGoalRow({ id: 'g1' })], [makeMilestoneRow({ id: 'm1', type: 'MANUAL', status: 'PENDING' })]);
    const result = await service.complete(OWNER, 'g1', 'm1');
    expect(result.status).toBe('COMPLETED');
  });

  it('rejects completing an AUTOMATIC milestone directly — only the progress engine can', async () => {
    const { service } = makeService([makeGoalRow({ id: 'g1' })], [makeMilestoneRow({ id: 'm1', type: 'AUTOMATIC', targetCount: 5 })]);
    await expect(service.complete(OWNER, 'g1', 'm1')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects completing an already-COMPLETED milestone', async () => {
    const { service } = makeService([makeGoalRow({ id: 'g1' })], [makeMilestoneRow({ id: 'm1', type: 'MANUAL', status: 'COMPLETED' })]);
    await expect(service.complete(OWNER, 'g1', 'm1')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('fail() transitions a PENDING MANUAL milestone to FAILED', async () => {
    const { service } = makeService([makeGoalRow({ id: 'g1' })], [makeMilestoneRow({ id: 'm1', type: 'MANUAL', status: 'PENDING' })]);
    const result = await service.fail(OWNER, 'g1', 'm1');
    expect(result.status).toBe('FAILED');
  });
});
