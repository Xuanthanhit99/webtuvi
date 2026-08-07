import { Module } from '@nestjs/common';
import { GoalDataSourceService } from './sources/goal-data-source.service';
import { GoalProgressEngineService } from './progress/goal-progress-engine.service';
import { GoalRecordService } from './record/goal-record.service';
import { GoalMilestoneService } from './milestone/goal-milestone.service';
import { GoalRelationshipService } from './relationship/goal-relationship.service';
import { GoalController } from './goal.controller';

/**
 * Goal System & Progress Engine (Sprint 5C). First-class, deterministic learning/life goals: CRUD,
 * milestones, a deterministic progress engine, and real evidence citing Memory/Journal/Reflection/
 * Insight/Review rows. Generates no new candidates in any prior module — see
 * docs/architecture/goal-system.md. `CompanionModule`'s Phase 7 "active goals" context line reads
 * `Goal` titles via a direct, bounded Prisma query in `ContextBuilderService` (the same "profile/
 * conversation reads happen directly, no assembler needed for a plain field list" precedent that
 * service already uses) rather than importing this module — invoking the full progress engine on
 * every conversation turn just to read titles would be unnecessary work.
 */
@Module({
  controllers: [GoalController],
  providers: [GoalDataSourceService, GoalProgressEngineService, GoalRecordService, GoalMilestoneService, GoalRelationshipService],
})
export class GoalModule {}
