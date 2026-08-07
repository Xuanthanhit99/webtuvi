import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { Goal, GoalCategory, GoalDifficulty, GoalHistoryAction, GoalMilestone, GoalStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { GoalProgressEngineService } from '../progress/goal-progress-engine.service';
import { toGoalHistoryDto, toGoalSummaryDto, type GoalHistoryDto, type GoalSummaryDto } from '../goal.mappers';
import type { CreateGoalDto } from '../dto/create-goal.dto';
import type { UpdateGoalDto } from '../dto/update-goal.dto';

export interface ListGoalsParams {
  status?: GoalStatus;
  category?: GoalCategory;
  page?: number;
  pageSize?: number;
}

export interface ListGoalsResult {
  items: GoalSummaryDto[];
  total: number;
  page: number;
  pageSize: number;
}

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

const INCLUDE = { milestones: true, progress: { include: { evidence: true } } } as const;
type GoalWithRelations = Goal & { milestones: GoalMilestone[] };

type TransitionAction = 'pause' | 'resume' | 'complete' | 'abandon' | 'archive' | 'delete' | 'restore';

/** Phase 2 — every explicit status transition this sprint's brief lists, each its own method
 * (never a generic `setStatus` the client could call with an arbitrary value) — mirrors Journal
 * Foundation's own archive/restore + Memory's own archive/restore precedent, extended with
 * pause/resume/complete/abandon per this sprint's own brief. Status transitions are always
 * explicit user actions (sprint-5c-progress.md #5) — nothing here is set as a side effect of a
 * progress recompute. */
const ALLOWED_TRANSITIONS: Record<TransitionAction, GoalStatus[]> = {
  pause: ['ACTIVE'],
  resume: ['PAUSED'],
  complete: ['ACTIVE', 'PAUSED'],
  abandon: ['ACTIVE', 'PAUSED'],
  archive: ['ACTIVE', 'PAUSED', 'COMPLETED', 'ABANDONED'],
  delete: ['ACTIVE', 'PAUSED', 'COMPLETED', 'ABANDONED', 'ARCHIVED'],
  restore: ['ARCHIVED', 'DELETED'],
};

@Injectable()
export class GoalRecordService {
  private readonly logger = new Logger('Goal');

  constructor(
    private readonly prisma: PrismaService,
    private readonly progressEngine: GoalProgressEngineService,
  ) {}

  async create(userId: string, dto: CreateGoalDto): Promise<GoalSummaryDto> {
    if (dto.type === 'METRIC_BASED' && !dto.targetValue) {
      throw new BadRequestException({ code: 'GOAL_TARGET_VALUE_REQUIRED', message: 'A metric-based goal needs a target value.' });
    }

    const goal = await this.prisma.goal.create({
      data: {
        userId,
        title: dto.title,
        description: dto.description ?? '',
        category: dto.category,
        type: dto.type,
        difficulty: dto.difficulty ?? 'MEDIUM',
        visibility: dto.visibility ?? 'PRIVATE',
        linkedTag: dto.linkedTag,
        targetValue: dto.type === 'METRIC_BASED' ? dto.targetValue : null,
        targetUnit: dto.type === 'METRIC_BASED' ? (dto.targetUnit ?? null) : null,
        targetDate: dto.targetDate ? new Date(dto.targetDate) : null,
      },
    });
    await this.recordHistory(goal.id, 'CREATED', `Goal "${goal.title}" created.`);
    this.logger.log(`Goal created id=${goal.id} type=${goal.type} category=${goal.category}`);
    return this.getOne(userId, goal.id);
  }

  async update(userId: string, id: string, dto: UpdateGoalDto): Promise<GoalSummaryDto> {
    await this.findOwned(userId, id);
    await this.prisma.goal.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.category !== undefined ? { category: dto.category } : {}),
        ...(dto.difficulty !== undefined ? { difficulty: dto.difficulty as GoalDifficulty } : {}),
        ...(dto.visibility !== undefined ? { visibility: dto.visibility } : {}),
        ...(dto.targetValue !== undefined ? { targetValue: dto.targetValue } : {}),
        ...(dto.targetUnit !== undefined ? { targetUnit: dto.targetUnit } : {}),
        ...(dto.targetDate !== undefined ? { targetDate: new Date(dto.targetDate) } : {}),
      },
    });
    await this.recordHistory(id, 'UPDATED', 'Goal details updated.');
    return this.getOne(userId, id);
  }

  async list(userId: string, params: ListGoalsParams): Promise<ListGoalsResult> {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, params.pageSize ?? DEFAULT_PAGE_SIZE));

    const where = {
      userId,
      status: params.status ?? { notIn: ['ARCHIVED', 'DELETED'] as GoalStatus[] },
      ...(params.category ? { category: params.category } : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.goal.count({ where }),
      this.prisma.goal.findMany({ where, include: INCLUDE, orderBy: [{ createdAt: 'desc' }], skip: (page - 1) * pageSize, take: pageSize }),
    ]);

    return { items: rows.map(toGoalSummaryDto), total, page, pageSize };
  }

  async getOne(userId: string, id: string): Promise<GoalSummaryDto> {
    const goal = await this.findOwned(userId, id);
    if (goal.status !== 'DELETED') {
      await this.progressEngine.ensureComputed(goal);
    }
    const fresh = await this.prisma.goal.findUniqueOrThrow({ where: { id }, include: INCLUDE });
    return toGoalSummaryDto(fresh);
  }

  async history(userId: string, id: string): Promise<GoalHistoryDto[]> {
    await this.findOwned(userId, id);
    const rows = await this.prisma.goalHistory.findMany({ where: { goalId: id }, orderBy: { createdAt: 'desc' } });
    return rows.map(toGoalHistoryDto);
  }

  async pause(userId: string, id: string): Promise<GoalSummaryDto> {
    return this.transition(userId, id, 'pause', { status: 'PAUSED' }, 'PAUSED', 'Goal paused.');
  }

  async resume(userId: string, id: string): Promise<GoalSummaryDto> {
    return this.transition(userId, id, 'resume', { status: 'ACTIVE' }, 'RESUMED', 'Goal resumed.');
  }

  async complete(userId: string, id: string): Promise<GoalSummaryDto> {
    return this.transition(userId, id, 'complete', { status: 'COMPLETED', completedAt: new Date() }, 'COMPLETED', 'Goal marked complete.');
  }

  async abandon(userId: string, id: string): Promise<GoalSummaryDto> {
    return this.transition(userId, id, 'abandon', { status: 'ABANDONED' }, 'ABANDONED', 'Goal abandoned.');
  }

  async archive(userId: string, id: string): Promise<GoalSummaryDto> {
    const goal = await this.findOwned(userId, id);
    this.assertTransition(goal, 'archive');
    await this.prisma.goal.update({ where: { id }, data: { previousStatus: goal.status, status: 'ARCHIVED', archivedAt: new Date() } });
    await this.recordHistory(id, 'ARCHIVED', 'Goal archived.');
    return this.getOne(userId, id);
  }

  async remove(userId: string, id: string): Promise<GoalSummaryDto> {
    const goal = await this.findOwned(userId, id);
    this.assertTransition(goal, 'delete');
    await this.prisma.goal.update({ where: { id }, data: { previousStatus: goal.status, status: 'DELETED', deletedAt: new Date() } });
    await this.recordHistory(id, 'DELETED', 'Goal deleted.');
    return this.getOne(userId, id);
  }

  async restore(userId: string, id: string): Promise<GoalSummaryDto> {
    const goal = await this.findOwned(userId, id);
    this.assertTransition(goal, 'restore');
    await this.prisma.goal.update({
      where: { id },
      data: { status: goal.previousStatus ?? 'ACTIVE', previousStatus: null, archivedAt: null, deletedAt: null },
    });
    await this.recordHistory(id, 'RESTORED', 'Goal restored.');
    return this.getOne(userId, id);
  }

  /** Owner-scoped fetch — 404s identically for "doesn't exist" and "belongs to someone else", the
   * same discipline every prior engine in this codebase uses. */
  async findOwnedRaw(userId: string, id: string): Promise<GoalWithRelations> {
    return this.findOwned(userId, id);
  }

  private async transition(
    userId: string,
    id: string,
    action: TransitionAction,
    data: Partial<Goal>,
    historyAction: GoalHistoryAction,
    detail: string,
  ): Promise<GoalSummaryDto> {
    const goal = await this.findOwned(userId, id);
    this.assertTransition(goal, action);
    await this.prisma.goal.update({ where: { id }, data });
    await this.recordHistory(id, historyAction, detail);
    return this.getOne(userId, id);
  }

  private assertTransition(goal: Goal, action: TransitionAction): void {
    if (!ALLOWED_TRANSITIONS[action].includes(goal.status)) {
      throw new BadRequestException({
        code: 'GOAL_INVALID_TRANSITION',
        message: `Cannot ${action} a goal with status ${goal.status}.`,
      });
    }
  }

  private async recordHistory(goalId: string, action: GoalHistoryAction, detail: string): Promise<void> {
    await this.prisma.goalHistory.create({ data: { goalId, action, detail } });
  }

  private async findOwned(userId: string, id: string): Promise<GoalWithRelations> {
    const goal = await this.prisma.goal.findUnique({ where: { id }, include: { milestones: true } });
    if (!goal || goal.userId !== userId) {
      throw new NotFoundException({ code: 'GOAL_NOT_FOUND', message: 'That goal was not found.' });
    }
    return goal;
  }
}
