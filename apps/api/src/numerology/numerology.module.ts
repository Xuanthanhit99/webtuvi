import { Module } from '@nestjs/common';
import { CompanionModule } from '../companion/companion.module';
import { MemoryModule } from '../memory/memory.module';
import { PaymentModule } from '../payment/payment.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { NumerologyInterpretationService } from './interpretation/numerology-interpretation.service';
import { NumerologyRecordService } from './record/numerology-record.service';
import { NumerologyController } from './numerology.controller';

/**
 * Numerology Discovery Foundation (Sprint 8) — the Product Bible's second real Discovery system
 * (Module 15). A deterministic, versioned, standard-Pythagorean numerology engine
 * (`engine/numerology-engine.ts`), persisted readings, and a narrow AI interpretation layer that
 * only ever narrates an already-real, already-calculated result. Generates no new
 * Reflection/Insight/Review/Goal rows — those remain frozen. See
 * docs/architecture/numerology-discovery.md.
 *
 * Imports `CompanionModule` for `ProviderOrchestratorService`/`SafetyService` only (reusing
 * Companion's existing AI provider chain and safety checks, never a second AI client — mirrors
 * `TarotModule`'s own import exactly), `MemoryModule` for `MemoryRetrievalService` (the same "at
 * most one relevant memory, Premium only" rule Tarot already applies), and `PaymentModule` for
 * `EntitlementService`, the one place `NumerologyRecordService` decides Free vs Premium
 * interpretation depth/history depth (see docs/architecture/premium-entitlements.md).
 */
@Module({
  imports: [CompanionModule, MemoryModule, PaymentModule, AnalyticsModule],
  controllers: [NumerologyController],
  providers: [NumerologyRecordService, NumerologyInterpretationService],
})
export class NumerologyModule {}
