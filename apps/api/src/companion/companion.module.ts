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
import { MemoryContextAssembler } from './memory/memory-context-assembler.service';
import { MemoryExplanationService } from './memory/memory-explanation.service';
import { MemorySuggestionService } from './memory/memory-suggestion.service';
import { CompanionForgetService } from './memory/companion-forget.service';
import { CompanionMemoryController } from './memory/companion-memory.controller';

/**
 * Companion Core (Sprint 2B) + Companion/Memory Integration (Sprint 3C). Still not a Memory
 * Engine itself: no embeddings, no vector store, no semantic search anywhere here — the memory
 * pieces in this module (`memory/`) are integration glue, calling into Memory Intelligence
 * (`MemoryModule`, imported below) rather than reimplementing anything. See
 * docs/architecture/companion-core.md and docs/architecture/companion-memory-integration.md.
 */
@Module({
  imports: [ActivitiesModule, MemoryModule],
  controllers: [ConversationController, StreamController, CompanionMemoryController],
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
  ],
})
export class CompanionModule {}
