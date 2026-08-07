import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { GoalRelationshipDto } from '../goal.mappers';
import type { CreateRelationshipDto } from '../dto/create-relationship.dto';

/** A minimal, real, user-created link between two of the caller's own Goals — no automatic
 * relationship detection (would require semantic comparison between goals, out of scope this
 * sprint; see sprint-5c-progress.md #8). Both sides of every relationship must be owned by the
 * caller — a relationship can never point at another user's goal. */
@Injectable()
export class GoalRelationshipService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, goalId: string, dto: CreateRelationshipDto): Promise<GoalRelationshipDto> {
    if (dto.goalId === goalId) {
      throw new BadRequestException({ code: 'GOAL_RELATIONSHIP_SELF', message: 'A goal cannot relate to itself.' });
    }
    const [goalA, goalB] = await Promise.all([this.findOwned(userId, goalId), this.findOwned(userId, dto.goalId)]);

    const relationship = await this.prisma.goalRelationship.create({
      data: { goalAId: goalA.id, goalBId: goalB.id, type: dto.type },
    });
    return { id: relationship.id, type: relationship.type, goalId: goalB.id, goalTitle: goalB.title, direction: 'A' };
  }

  async list(userId: string, goalId: string): Promise<GoalRelationshipDto[]> {
    await this.findOwned(userId, goalId);
    const rows = await this.prisma.goalRelationship.findMany({
      where: { OR: [{ goalAId: goalId }, { goalBId: goalId }] },
      include: { goalA: true, goalB: true },
    });
    return rows.map((r) => {
      const isA = r.goalAId === goalId;
      const other = isA ? r.goalB : r.goalA;
      return { id: r.id, type: r.type, goalId: other.id, goalTitle: other.title, direction: (isA ? 'A' : 'B') as 'A' | 'B' };
    });
  }

  async remove(userId: string, goalId: string, relationshipId: string): Promise<void> {
    await this.findOwned(userId, goalId);
    const relationship = await this.prisma.goalRelationship.findUnique({ where: { id: relationshipId } });
    if (!relationship || (relationship.goalAId !== goalId && relationship.goalBId !== goalId)) {
      throw new NotFoundException({ code: 'GOAL_RELATIONSHIP_NOT_FOUND', message: 'That relationship was not found.' });
    }
    await this.prisma.goalRelationship.delete({ where: { id: relationshipId } });
  }

  private async findOwned(userId: string, goalId: string): Promise<{ id: string; title: string }> {
    const goal = await this.prisma.goal.findUnique({ where: { id: goalId }, select: { id: true, title: true, userId: true } });
    if (!goal || goal.userId !== userId) {
      throw new NotFoundException({ code: 'GOAL_NOT_FOUND', message: 'That goal was not found.' });
    }
    return goal;
  }
}
