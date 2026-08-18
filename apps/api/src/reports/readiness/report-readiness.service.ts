import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { ReportReadinessDto } from '../reports.types';

/** Bounded lookback for optional Tarot enrichment — locked decision #5 ("recent context, not core
 * identity... a bounded history window/count... from measurement, not an arbitrary large dump").
 * No real usage data exists yet to measure against, so this starts conservative and explicit
 * (5 most recent ACTIVE readings, no older than 90 days) rather than guessing a large number —
 * revisit once real generation volume exists to measure against. */
export const TAROT_LOOKBACK_COUNT = 5;
export const TAROT_LOOKBACK_DAYS = 90;

/**
 * Deterministic readiness check (locked decision #4/#6 of this sprint's DoD) — computes whether a
 * user has both required sources (Natal Chart, Numerology) without ever triggering AI generation.
 * Read-only, side-effect-free, safe to call on every Reports dashboard load.
 */
@Injectable()
export class ReportReadinessService {
  constructor(private readonly prisma: PrismaService) {}

  async check(userId: string): Promise<ReportReadinessDto> {
    const lookbackStart = new Date(Date.now() - TAROT_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);

    const [natalChart, numerology, tarotCount, memoryCount] = await Promise.all([
      this.prisma.natalChart.findFirst({ where: { userId, status: 'ACTIVE' }, orderBy: { createdAt: 'desc' }, select: { id: true } }),
      this.prisma.numerologyReading.findFirst({ where: { userId, status: 'ACTIVE' }, orderBy: { createdAt: 'desc' }, select: { id: true } }),
      this.prisma.tarotReading.count({ where: { userId, status: 'ACTIVE', createdAt: { gte: lookbackStart } } }),
      this.prisma.memory.count({ where: { userId, status: 'ACCEPTED' } }),
    ]);

    return {
      ready: !!natalChart && !!numerology,
      natalChart: { available: !!natalChart, sourceId: natalChart?.id ?? null },
      numerology: { available: !!numerology, sourceId: numerology?.id ?? null },
      tarot: { available: tarotCount > 0, count: Math.min(tarotCount, TAROT_LOOKBACK_COUNT) },
      memory: { available: memoryCount > 0 },
    };
  }

  /** Same required-source check, thrown as a typed result the generation service can act on —
   * kept separate from `check()` so the read-only dashboard query never has generation-specific
   * error-shaping concerns mixed into it. */
  async requireReadySources(userId: string): Promise<{ natalChartId: string; numerologyReadingId: string }> {
    const readiness = await this.check(userId);
    if (!readiness.natalChart.available || !readiness.numerology.available) {
      return { natalChartId: '', numerologyReadingId: '' };
    }
    return { natalChartId: readiness.natalChart.sourceId!, numerologyReadingId: readiness.numerology.sourceId! };
  }
}
