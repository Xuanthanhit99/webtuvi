import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { GoalMilestone } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { toGoalMilestoneDto, type GoalMilestoneDto } from '../goal.mappers';
import type { CreateMilestoneDto } from '../dto/create-milestone.dto';
import type { UpdateMilestoneDto } from '../dto/update-milestone.dto';

/** Phase 5 — Milestone CRUD + the two explicit user-only transitions (`complete`/`fail`).
 * `AUTOMATIC` milestones are never completed/failed through this service — only
 * `GoalProgressEngineService`'s own recompute pass can complete one, deterministically, once the
 * goal's real evidence count reaches `targetCount` (see progress/goal-progress.util.ts). */
@Injectable()
export class GoalMilestoneService {
  private readonly logger = new Logger('GoalMilestone');

  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, goalId: string, dto: CreateMilestoneDto): Promise<GoalMilestoneDto> {
    await this.findOwnedGoal(userId, goalId);
    if (dto.type === 'AUTOMATIC' && !dto.targetCount) {
      throw new BadRequestException({ code: 'GOAL_MILESTONE_TARGET_COUNT_REQUIRED', message: 'An automatic milestone needs a target evidence count.' });
    }

    const maxOrder = await this.prisma.goalMilestone.aggregate({ where: { goalId }, _max: { order: true } });
    const milestone = await this.prisma.goalMilestone.create({
      data: {
        goalId,
        title: dto.title,
        description: dto.description ?? '',
        type: dto.type,
        targetCount: dto.type === 'AUTOMATIC' ? dto.targetCount : null,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        order: (maxOrder._max.order ?? -1) + 1,
      },
    });
    this.logger.log(`Goal milestone created id=${milestone.id} goalId=${goalId} type=${milestone.type}`);
    return toGoalMilestoneDto(milestone);
  }

  async update(userId: string, goalId: string, milestoneId: string, dto: UpdateMilestoneDto): Promise<GoalMilestoneDto> {
    await this.findOwnedMilestone(userId, goalId, milestoneId);
    const updated = await this.prisma.goalMilestone.update({
      where: { id: milestoneId },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.dueDate !== undefined ? { dueDate: new Date(dto.dueDate) } : {}),
      },
    });
    return toGoalMilestoneDto(updated);
  }

  async complete(userId: string, goalId: string, milestoneId: string): Promise<GoalMilestoneDto> {
    const milestone = await this.findOwnedMilestone(userId, goalId, milestoneId);
    this.assertManualPending(milestone);
    const updated = await this.prisma.goalMilestone.update({
      where: { id: milestoneId },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });
    await this.prisma.goalHistory.create({ data: { goalId, action: 'MILESTONE_COMPLETED', detail: `Milestone "${milestone.title}" completed.` } });
    return toGoalMilestoneDto(updated);
  }

  async fail(userId: string, goalId: string, milestoneId: string): Promise<GoalMilestoneDto> {
    const milestone = await this.findOwnedMilestone(userId, goalId, milestoneId);
    this.assertManualPending(milestone);
    const updated = await this.prisma.goalMilestone.update({
      where: { id: milestoneId },
      data: { status: 'FAILED', failedAt: new Date() },
    });
    await this.prisma.goalHistory.create({ data: { goalId, action: 'MILESTONE_FAILED', detail: `Milestone "${milestone.title}" failed.` } });
    return toGoalMilestoneDto(updated);
  }

  async archive(userId: string, goalId: string, milestoneId: string): Promise<GoalMilestoneDto> {
    await this.findOwnedMilestone(userId, goalId, milestoneId);
    const updated = await this.prisma.goalMilestone.update({ where: { id: milestoneId }, data: { status: 'ARCHIVED' } });
    return toGoalMilestoneDto(updated);
  }

  private assertManualPending(milestone: GoalMilestone): void {
    if (milestone.type !== 'MANUAL') {
      throw new BadRequestException({ code: 'GOAL_MILESTONE_NOT_MANUAL', message: 'Only manual milestones can be completed or failed directly.' });
    }
    if (milestone.status !== 'PENDING') {
      throw new BadRequestException({ code: 'GOAL_MILESTONE_INVALID_TRANSITION', message: `Cannot transition a milestone with status ${milestone.status}.` });
    }
  }

  private async findOwnedGoal(userId: string, goalId: string): Promise<void> {
    const goal = await this.prisma.goal.findUnique({ where: { id: goalId } });
    if (!goal || goal.userId !== userId) {
      throw new NotFoundException({ code: 'GOAL_NOT_FOUND', message: 'That goal was not found.' });
    }
  }

  private async findOwnedMilestone(userId: string, goalId: string, milestoneId: string): Promise<GoalMilestone> {
    const milestone = await this.prisma.goalMilestone.findUnique({ where: { id: milestoneId } });
    if (!milestone || milestone.goalId !== goalId) {
      throw new NotFoundException({ code: 'GOAL_MILESTONE_NOT_FOUND', message: 'That milestone was not found.' });
    }
    await this.findOwnedGoal(userId, goalId);
    return milestone;
  }
}
