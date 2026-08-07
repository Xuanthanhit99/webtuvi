import { Injectable, Logger } from '@nestjs/common';
import type { Goal, GoalEvidenceSourceType, GoalMilestone, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { GoalDataSourceService } from '../sources/goal-data-source.service';
import { computeGoalProgress } from './goal-progress.util';
import type { GoalProgressFactors } from '../goal.types';

/**
 * Orchestrates Progress Engine recomputation (Phase 3) — compute-on-read, no background job,
 * mirroring `ReviewGenerationService`/`InsightGenerationService`'s own precedent exactly.
 * `GoalProgress` is recomputed **in place** (one row per goal, never appended — see
 * `sprint-5c-progress.md` #3): `previousCompletionPercent`/`previousComputedAt` are captured just
 * before being overwritten, which is what makes `GoalTrend` derivable without a second history
 * table. `GoalEvidence` rows are deleted and recreated fresh every pass, the same discipline
 * `ReviewGenerationService`/`InsightGenerationService` already use for their own evidence tables.
 */
@Injectable()
export class GoalProgressEngineService {
  private readonly logger = new Logger('GoalProgress');

  // Per-goal single-flight lock — same reasoning ReviewGenerationService documents for its own
  // concurrent-caller race (a list + detail request landing together).
  private readonly inFlight = new Map<string, Promise<void>>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly dataSource: GoalDataSourceService,
  ) {}

  async ensureComputed(goal: Goal & { milestones: GoalMilestone[] }): Promise<void> {
    const existing = this.inFlight.get(goal.id);
    if (existing) return existing;

    const run = this.recompute(goal).finally(() => this.inFlight.delete(goal.id));
    this.inFlight.set(goal.id, run);
    return run;
  }

  private async recompute(goal: Goal & { milestones: GoalMilestone[] }): Promise<void> {
    const startedAt = Date.now();

    const previous = await this.prisma.goalProgress.findUnique({ where: { goalId: goal.id } });
    const data = await this.dataSource.fetch(goal.userId, goal.linkedTag, goal.startedAt);

    const result = computeGoalProgress({
      type: goal.type,
      status: goal.status,
      targetValue: goal.targetValue,
      milestones: goal.milestones.map((m) => ({ id: m.id, type: m.type, status: m.status, targetCount: m.targetCount })),
      evidenceCount: data.evidence.length,
      previousCompletionPercent: previous?.completionPercent ?? null,
    });

    const progress = await this.prisma.goalProgress.upsert({
      where: { goalId: goal.id },
      create: {
        goalId: goal.id,
        completionPercent: result.completionPercent,
        milestoneCompletionPercent: result.milestoneCompletionPercent,
        factors: result.factors as unknown as Prisma.InputJsonValue,
        trend: result.trend,
        previousCompletionPercent: previous?.completionPercent ?? null,
        previousComputedAt: previous?.computedAt ?? null,
      },
      update: {
        completionPercent: result.completionPercent,
        milestoneCompletionPercent: result.milestoneCompletionPercent,
        factors: result.factors as unknown as Prisma.InputJsonValue,
        trend: result.trend,
        previousCompletionPercent: previous?.completionPercent ?? null,
        previousComputedAt: previous?.computedAt ?? null,
        computedAt: new Date(),
      },
    });

    await this.prisma.goalEvidence.deleteMany({ where: { goalProgressId: progress.id } });
    if (data.evidence.length > 0) {
      await this.prisma.goalEvidence.createMany({
        data: data.evidence.map((e) => ({
          goalProgressId: progress.id,
          sourceType: e.sourceType as GoalEvidenceSourceType,
          sourceId: e.sourceId,
          sourceTimestamp: e.sourceTimestamp,
          contribution: e.contribution,
        })),
      });
    }

    if (result.milestonesToAutoComplete.length > 0) {
      await this.prisma.goalMilestone.updateMany({
        where: { id: { in: result.milestonesToAutoComplete } },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });
      await this.prisma.goalHistory.createMany({
        data: result.milestonesToAutoComplete.map(() => ({
          goalId: goal.id,
          action: 'MILESTONE_COMPLETED' as const,
          detail: `Milestone automatically completed (evidence count reached its target).`,
        })),
      });
    }

    const factors = result.factors as GoalProgressFactors;
    this.logger.log(
      `Goal progress recompute: goal=${goal.id} type=${goal.type} completion=${result.completionPercent} trend=${result.trend} evidence=${factors.evidenceCount} autoCompleted=${result.milestonesToAutoComplete.length} latencyMs=${Date.now() - startedAt}`,
    );
  }
}
