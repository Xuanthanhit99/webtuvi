import { Module } from '@nestjs/common';
import { CompanionModule } from '../companion/companion.module';
import { MemoryModule } from '../memory/memory.module';
import { PaymentModule } from '../payment/payment.module';
import { GeocodingModule } from '../geocoding/geocoding.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { NatalChartCalculatorService } from './engine/natal-chart-calculator.service';
import { NatalChartInterpretationService } from './interpretation/natal-chart-interpretation.service';
import { NatalChartRecordService } from './record/natal-chart-record.service';
import { NatalChartController } from './natal-chart.controller';

/**
 * Natal Chart Discovery Foundation (Sprint 9) — the Product Bible's third real Discovery system
 * (Module 13). A deterministic, ephemeris-based chart engine
 * (`engine/natal-chart-calculator.service.ts`), persisted charts, and a narrow AI interpretation
 * layer that only ever narrates an already-real, already-calculated chart. Generates no new
 * Reflection/Insight/Review/Goal rows — those remain frozen. See
 * docs/architecture/natal-chart-discovery.md.
 *
 * Imports `CompanionModule` for `ProviderOrchestratorService`/`SafetyService` only (reusing
 * Companion's existing AI provider chain and safety checks, never a second AI client — mirrors
 * `NumerologyModule`'s own import exactly), `MemoryModule` for `MemoryRetrievalService` (the same
 * "at most one relevant memory, Premium only" rule Numerology already applies), `PaymentModule`
 * for `EntitlementService`, and `GeocodingModule` for server-side-only place-name resolution
 * (Phase 8).
 */
@Module({
  imports: [CompanionModule, MemoryModule, PaymentModule, GeocodingModule, AnalyticsModule],
  controllers: [NatalChartController],
  providers: [NatalChartCalculatorService, NatalChartInterpretationService, NatalChartRecordService],
})
export class NatalChartModule {}
