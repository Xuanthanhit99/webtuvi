import { Module } from '@nestjs/common';
import { CompanionModule } from '../companion/companion.module';
import { MemoryModule } from '../memory/memory.module';
import { PaymentModule } from '../payment/payment.module';
import { TarotDeckService } from './deck/tarot-deck.service';
import { TarotInterpretationService } from './interpretation/tarot-interpretation.service';
import { TarotRecordService } from './record/tarot-record.service';
import { TarotController } from './tarot.controller';

/**
 * Tarot Discovery Foundation (Sprint 6) — the Product Bible's first real Discovery system
 * (Module 12). A deterministic, seeded draw engine over a real 78-card deck, persisted readings,
 * and a narrow AI interpretation layer that only ever narrates an already-real, already-drawn
 * result. Generates no new Reflection/Insight/Review/Goal rows — those remain frozen, untouched
 * by this module. See docs/architecture/tarot-discovery.md.
 *
 * Imports `CompanionModule` for `ProviderOrchestratorService`/`SafetyService` only (reusing
 * Companion's existing AI provider chain and safety checks, never a second AI client),
 * `MemoryModule` for `MemoryRetrievalService` (Module 12's "at most one relevant memory" rule), and
 * — Sprint 7 — `PaymentModule` for `EntitlementService`, the one place `TarotRecordService` decides
 * Free vs Premium usage limits/interpretation depth/history depth (see
 * docs/architecture/premium-entitlements.md).
 */
@Module({
  imports: [CompanionModule, MemoryModule, PaymentModule],
  controllers: [TarotController],
  providers: [TarotDeckService, TarotRecordService, TarotInterpretationService],
})
export class TarotModule {}
