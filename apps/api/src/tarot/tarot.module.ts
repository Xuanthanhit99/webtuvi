import { Module } from '@nestjs/common';
import { CompanionModule } from '../companion/companion.module';
import { MemoryModule } from '../memory/memory.module';
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
 * Companion's existing AI provider chain and safety checks, never a second AI client) and
 * `MemoryModule` for `MemoryRetrievalService` (Module 12's "at most one relevant memory" rule).
 */
@Module({
  imports: [CompanionModule, MemoryModule],
  controllers: [TarotController],
  providers: [TarotDeckService, TarotRecordService, TarotInterpretationService],
})
export class TarotModule {}
