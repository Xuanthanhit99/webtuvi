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
import { ActivitiesModule } from '../activities/activities.module';

/**
 * Companion Core (Sprint 2B) — replaces Sprint 1's rule-based Companion in
 * place. See docs/architecture/companion-core.md. Explicitly not a Memory
 * Engine: no embeddings, no vector store, no semantic search anywhere here.
 */
@Module({
  imports: [ActivitiesModule],
  controllers: [ConversationController, StreamController],
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
  ],
})
export class CompanionModule {}
