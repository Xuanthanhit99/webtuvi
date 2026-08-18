import { Module } from '@nestjs/common';
import { CompanionModule } from '../companion/companion.module';
import { MemoryModule } from '../memory/memory.module';
import { PaymentModule } from '../payment/payment.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { EasternHoroscopeInterpretationService } from './interpretation/eastern-horoscope-interpretation.service';
import { EasternHoroscopeRecordService } from './record/eastern-horoscope-record.service';
import { EasternHoroscopeController } from './eastern-horoscope.controller';

/**
 * Eastern Horoscope Discovery Foundation (Sprint 17) — the Product Bible's Chinese Zodiac / Five
 * Elements Discovery module (Module 14), independent of and never conflated with Vietnamese Tử Vi
 * Đẩu Số (a separate, later track — Sprints 15/18/19+). A deterministic, versioned lunisolar-
 * calendar + Stem/Branch/Element engine (`engine/`), persisted profiles, and a narrow AI
 * interpretation layer that only ever narrates an already-real, already-calculated result. Domain
 * rules locked in `docs/domain/eastern-horoscope-rules.md` (Sprint 17 Domain Decision Closure).
 *
 * Imports mirror `NumerologyModule` exactly: `CompanionModule` for
 * `ProviderOrchestratorService`/`SafetyService` only (reusing Companion's existing AI provider
 * chain and safety checks, never a second AI client), `MemoryModule` for
 * `MemoryRetrievalService` (the same "at most one relevant memory, Premium only" rule), and
 * `PaymentModule` for `EntitlementService`.
 */
@Module({
  imports: [CompanionModule, MemoryModule, PaymentModule, AnalyticsModule],
  controllers: [EasternHoroscopeController],
  providers: [EasternHoroscopeRecordService, EasternHoroscopeInterpretationService],
})
export class EasternHoroscopeModule {}
