import { Module } from '@nestjs/common';
import { CompanionModule } from '../companion/companion.module';
import { MemoryModule } from '../memory/memory.module';
import { PaymentModule } from '../payment/payment.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { TuViInterpretationService } from './interpretation/tu-vi-interpretation.service';
import { TuViRecordService } from './record/tu-vi-record.service';
import { TuViController } from './tu-vi.controller';

/**
 * Vietnamese Tử Vi Đẩu Số V1 (`TUVI_RULESET_V1 = VDTTL_1956_V1`) — Sprint 18B. A deterministic,
 * versioned engine (`engine/`, 18B.1–18B.8), persisted charts (18B.9), and a narrow AI
 * interpretation layer (18B.10) that only ever narrates an already-real, already-calculated
 * result. Independent of, and never conflated with, Eastern Horoscope (a separate track).
 *
 * Imports mirror `EasternHoroscopeModule` exactly: `CompanionModule` for
 * `ProviderOrchestratorService`/`SafetyService`/`CostControlService`/`GenerationLockService`/
 * `ObservabilityService` (reusing Companion's existing AI provider chain and safety checks, never
 * a second AI client), `MemoryModule` for `MemoryRetrievalService` (the same "at most one relevant
 * memory, Premium only" rule), `PaymentModule` for `EntitlementService`, and `AnalyticsModule` for
 * the bounded `tu_vi_started`/`tu_vi_completed` server event.
 */
@Module({
  imports: [CompanionModule, MemoryModule, PaymentModule, AnalyticsModule],
  controllers: [TuViController],
  providers: [TuViRecordService, TuViInterpretationService],
})
export class TuViModule {}
