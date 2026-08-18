import { Module } from '@nestjs/common';
import { CompanionModule } from '../companion/companion.module';
import { MemoryModule } from '../memory/memory.module';
import { PaymentModule } from '../payment/payment.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { ReportReadinessService } from './readiness/report-readiness.service';
import { ReportSnapshotService } from './snapshot/report-snapshot.service';
import { ReportGenerationService } from './generation/report-generation.service';
import { ReportRecordService } from './record/report-record.service';
import { ReportsController } from './reports.controller';

/**
 * Personal Destiny Report (Sprint 16) — synthesizes Natal Chart + Numerology (required) and
 * optional bounded Tarot/Memory context into one Premium long-form report. Explicitly excludes
 * Journal, Reflection/Insight/Review/Goal, Eastern Horoscope, and Vietnamese Tử Vi as inputs
 * (locked decisions, docs/product/personal-destiny-report-decisions.md) — no import from any of
 * those modules exists anywhere in this module.
 *
 * Imports `CompanionModule` for `ProviderOrchestratorService`/`SafetyService`/`CostControlService`/
 * `GenerationLockService`/`ObservabilityService` (reusing Companion's existing AI infrastructure
 * verbatim, mirroring NumerologyModule/TarotModule/NatalChartModule's own import exactly — no new
 * AI client, no new queue), `MemoryModule` for `MemoryRetrievalService` (same consent/budget/
 * ranking rules, strict small limit), and `PaymentModule` for `EntitlementService` (Premium gate).
 */
@Module({
  imports: [CompanionModule, MemoryModule, PaymentModule, AnalyticsModule],
  controllers: [ReportsController],
  providers: [ReportReadinessService, ReportSnapshotService, ReportGenerationService, ReportRecordService],
  exports: [ReportReadinessService],
})
export class ReportsModule {}
