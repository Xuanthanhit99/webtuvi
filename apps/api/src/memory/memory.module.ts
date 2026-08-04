import { Module } from '@nestjs/common';
import { MemoryService } from './memory.service';
import { ActivitiesModule } from '../activities/activities.module';
import { MemoryAuditService } from './audit/memory-audit.service';
import { MemoryConsentService } from './consent/memory-consent.service';
import { MemoryConsentController } from './consent/memory-consent.controller';
import { MemoryCandidateService } from './candidate/memory-candidate.service';
import { MemoryCandidateController } from './candidate/memory-candidate.controller';
import { MemoryRecordService } from './record/memory-record.service';
import { MemoryRecordController } from './record/memory-record.controller';
import { MemoryExportService } from './export/memory-export.service';
import { MemoryExportController } from './export/memory-export.controller';
import { ImportanceScoringService } from './importance/importance-scoring.service';
import { MemoryDuplicateService } from './duplicate/memory-duplicate.service';
import { MemoryConflictService } from './conflict/memory-conflict.service';
import { MemoryMergeSuggestionService } from './merge/memory-merge-suggestion.service';
import { ContextBudgetService } from './budget/context-budget.service';
import { MemoryRetrievalService } from './retrieval/memory-retrieval.service';
import { MemoryIntelligenceController } from './intelligence/memory-intelligence.controller';

/**
 * Sprint 1's `MemoryService` (`mostRecent`, backed by the legacy `MemoryNote`
 * table) is kept only for the Dashboard's fallback highlight — `MemoryNote`
 * is now read-only going forward. Onboarding's Reflection step was cut over
 * (Sprint 3A release closure) to write directly to the new `Memory` model via
 * `MemoryCandidateService.createDirect`, so `createNote` has no remaining
 * caller. See docs/architecture/memory-engine.md "Onboarding cutover".
 */
@Module({
  imports: [ActivitiesModule],
  controllers: [
    MemoryConsentController,
    MemoryCandidateController,
    MemoryRecordController,
    MemoryExportController,
    MemoryIntelligenceController,
  ],
  providers: [
    MemoryService,
    MemoryAuditService,
    MemoryConsentService,
    MemoryCandidateService,
    MemoryRecordService,
    MemoryExportService,
    ImportanceScoringService,
    MemoryDuplicateService,
    MemoryConflictService,
    MemoryMergeSuggestionService,
    ContextBudgetService,
    MemoryRetrievalService,
  ],
  exports: [
    MemoryService,
    MemoryConsentService,
    MemoryCandidateService,
    MemoryRecordService,
    MemoryAuditService,
    ImportanceScoringService,
    // Sprint 3C (Companion integration) — MemoryRetrievalService is the one Memory Intelligence
    // service Companion is allowed to call (via MemoryContextAssembler), never the Memory Prisma
    // model directly. See docs/architecture/companion-memory-integration.md.
    MemoryRetrievalService,
  ],
})
export class MemoryModule {}
