import { Module } from '@nestjs/common';
import { MemoryModule } from '../memory/memory.module';
import { ReflectionDataSourceService } from './sources/reflection-data-source.service';
import { ReflectionRuleEngine } from './rules/reflection-rule-engine.service';
import { ReflectionScoreService } from './scoring/reflection-score.service';
import { ReflectionGenerationService } from './generation/reflection-generation.service';
import { ReflectionValidityService } from './validity/reflection-validity.service';
import { ReflectionRecordService } from './record/reflection-record.service';
import { ReflectionController } from './reflection.controller';
import { ReflectionHintService } from './hint/reflection-hint.service';

/**
 * Reflection Foundation (Sprint 4B). Deterministic Reflection Candidates from existing
 * user-owned data — explicitly NOT AI: no LLM-generated reflections, no AI summaries/coaching, no
 * reports, no mood/habit prediction, no embeddings/pgvector/vector database/semantic search/RAG/
 * knowledge graph/autonomous agents anywhere in this module. See
 * docs/architecture/reflection-foundation.md.
 *
 * Imports `MemoryModule` for `MemoryConflictService` only (GoalRegressionRule reuses Sprint 3B's
 * existing conflict detection rather than reimplementing contradiction detection) — nothing here
 * reads the `Memory`/`JournalEntry` Prisma models except through `ReflectionDataSourceService`
 * and `ReflectionValidityService`, both of which are read-only with respect to those tables.
 * `ReflectionHintService` is exported for `CompanionModule` — the one thing Companion is allowed
 * to know about Reflection: whether a `READY`, `COMPANION_VISIBLE` candidate currently exists.
 */
@Module({
  imports: [MemoryModule],
  controllers: [ReflectionController],
  providers: [
    ReflectionDataSourceService,
    ReflectionRuleEngine,
    ReflectionScoreService,
    ReflectionGenerationService,
    ReflectionValidityService,
    ReflectionRecordService,
    ReflectionHintService,
  ],
  exports: [ReflectionHintService],
})
export class ReflectionModule {}
