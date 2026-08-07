import { Module } from '@nestjs/common';
import { ReflectionModule } from '../reflection/reflection.module';
import { InsightDataSourceService } from './sources/insight-data-source.service';
import { InsightRelationshipService } from './relationships/insight-relationship.service';
import { InsightPriorityService } from './priority/insight-priority.service';
import { InsightGenerationService } from './generation/insight-generation.service';
import { InsightRecordService } from './record/insight-record.service';
import { InsightPresentationService } from './presentation/insight-presentation.service';
import { InsightController } from './insight.controller';

/**
 * Insight Preparation Engine (Sprint 4C). Prepares deterministic Insight Candidates from existing
 * Reflection Candidates — structured evidence for a future Sprint 5, never a user-facing insight
 * itself. Explicitly NOT AI: no LLM-generated insights, no AI summaries/coaching, no weekly/
 * monthly reports, no recommendations, no embeddings/vector database/semantic search/RAG/
 * autonomous agents/prompt optimization anywhere in this module. See
 * docs/architecture/insight-preparation.md.
 *
 * Imports `ReflectionModule` for `ReflectionGenerationService`/`ReflectionValidityService` only —
 * nothing here reads Journal/Memory/Activity/Companion directly; every real source this module
 * touches is a `ReflectionCandidate` (and, for the Priority Engine's memory-importance factor, the
 * `Memory` row a Reflection Candidate's own source already cited — read-only, never re-derived).
 *
 * `InsightPresentationService` (Sprint 5A — Insight Experience) is an additive presentation layer
 * on top of the same `InsightCandidate` rows: cards/timeline/evidence rendering, filters, and
 * pin/unpin. It generates no new insights — see docs/architecture/insight-experience.md.
 *
 * `InsightGenerationService` is exported so `ReviewModule` (Sprint 5B) can re-run Insight
 * Preparation's own regenerate pass before building a Review — the same transitive-freshness chain
 * this module already uses one layer down via `ReflectionModule`. Nothing else is exported: Review
 * reads Insight/Reflection data through `PrismaService` directly (real rows, `userId`-scoped), the
 * same way Insight itself reads Reflection data rather than going through a second service layer.
 */
@Module({
  imports: [ReflectionModule],
  controllers: [InsightController],
  providers: [
    InsightDataSourceService,
    InsightRelationshipService,
    InsightPriorityService,
    InsightGenerationService,
    InsightRecordService,
    InsightPresentationService,
  ],
  exports: [InsightGenerationService],
})
export class InsightModule {}
