import { Module } from '@nestjs/common';
import { InsightModule } from '../insight/insight.module';
import { ReviewDataSourceService } from './sources/review-data-source.service';
import { ReviewGenerationService } from './generation/review-generation.service';
import { ReviewRecordService } from './record/review-record.service';
import { ReviewExportService } from './export/review-export.service';
import { ReviewController } from './review.controller';

/**
 * Weekly & Monthly Reviews (Sprint 5B). Deterministically aggregates already-materialized
 * `InsightCandidate`/`ReflectionCandidate` rows (plus real Journal/Memory/Activity/Companion counts
 * for statistics) over a time window into a persisted `Review` document. Generates no new
 * `InsightCandidate`/`ReflectionCandidate` rows itself — see docs/architecture/review-engine.md.
 *
 * Imports `InsightModule` for `InsightGenerationService` only (to re-run Insight Preparation's own
 * regenerate pass first, the same transitive-freshness chain Insight Experience already
 * established) — nothing here reads Journal/Memory/Activity/Companion for evidence directly except
 * the two disclosed, real-flag-gated exceptions (achievement Memories, pinned Journal entries —
 * see review-generation.service.ts).
 */
@Module({
  imports: [InsightModule],
  controllers: [ReviewController],
  providers: [ReviewDataSourceService, ReviewGenerationService, ReviewRecordService, ReviewExportService],
})
export class ReviewModule {}
