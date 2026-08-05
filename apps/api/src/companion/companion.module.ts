import { Module } from '@nestjs/common';
import { ConversationController } from './conversation/conversation.controller';
import { ConversationService } from './conversation/conversation.service';
import { StreamController } from './stream/stream.controller';
import { StreamService } from './stream/stream.service';
import { ContextBuilderService } from './context/context-builder.service';
import { PromptBuilderService } from './prompt/prompt-builder.service';
import { SafetyService } from './safety/safety.service';
import { ObservabilityService } from './observability/observability.service';
import { CostControlService } from './cost/cost-control.service';
import { MockProvider } from './providers/mock.provider';
import { ProviderRegistryService } from './providers/provider-registry.service';
import { ProviderOrchestratorService } from './providers/provider-orchestrator.service';
import { GenerationLockService } from './concurrency/generation-lock.service';
import { ActivitiesModule } from '../activities/activities.module';
import { MemoryModule } from '../memory/memory.module';
import { JournalModule } from '../journal/journal.module';
import { ReflectionModule } from '../reflection/reflection.module';
import { MemoryContextAssembler } from './memory/memory-context-assembler.service';
import { MemoryExplanationService } from './memory/memory-explanation.service';
import { MemorySuggestionService } from './memory/memory-suggestion.service';
import { CompanionForgetService } from './memory/companion-forget.service';
import { CompanionMemoryController } from './memory/companion-memory.controller';
import { CompanionJournalService } from './journal/companion-journal.service';
import { CompanionJournalController } from './journal/companion-journal.controller';
import { CompanionReflectionController } from './reflection/companion-reflection.controller';

/**
 * Companion Core (Sprint 2B) + Companion/Memory Integration (Sprint 3C) + Companion/Journal
 * Integration (Sprint 4A). Still not a Memory Engine or a Reflection Engine: no embeddings, no
 * vector store, no semantic search, no AI-generated journal content anywhere here — the
 * memory/journal pieces in this module are integration glue, calling into Memory Intelligence
 * (`MemoryModule`) and Journal Foundation (`JournalModule`) rather than reimplementing anything.
 * See docs/architecture/companion-core.md, docs/architecture/companion-memory-integration.md,
 * and docs/architecture/journal-foundation.md.
 *
 * Sprint 4B adds `ReflectionModule` for `CompanionReflectionController`'s one read-only hint
 * endpoint — Companion still never generates, fabricates, or summarizes a reflection; see
 * docs/architecture/reflection-foundation.md "Companion integration".
 */
@Module({
  imports: [ActivitiesModule, MemoryModule, JournalModule, ReflectionModule],
  controllers: [ConversationController, StreamController, CompanionMemoryController, CompanionJournalController, CompanionReflectionController],
  providers: [
    ConversationService,
    StreamService,
    ContextBuilderService,
    PromptBuilderService,
    SafetyService,
    ObservabilityService,
    CostControlService,
    MockProvider,
    ProviderRegistryService,
    ProviderOrchestratorService,
    GenerationLockService,
    MemoryContextAssembler,
    MemoryExplanationService,
    MemorySuggestionService,
    CompanionForgetService,
    CompanionJournalService,
  ],
})
export class CompanionModule {}
