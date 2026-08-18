import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MemoryRetrievalService } from '../../memory/retrieval/memory-retrieval.service';
import { composeAspectMeaning, composePlacementMeaning } from '../../natal-chart/engine/natal-chart-meanings';
import { fromPrismaAspectType, fromPrismaPlanet, fromPrismaPoint, fromPrismaSign } from '../../natal-chart/natal-chart-enum.util';
import { getNumerologyMeaning } from '../../numerology/engine/numerology-meanings';
import type { NumerologyValueType } from '../../numerology/engine/numerology-engine';
import { TAROT_LOOKBACK_COUNT, TAROT_LOOKBACK_DAYS } from '../readiness/report-readiness.service';
import type { ReportMemorySnapshot, ReportSourceSnapshot, ReportTarotSnapshot } from '../reports.types';

/** Strict, small retrieval budget — locked decision #6: "tighter than Companion's own per-turn
 * budget, not just a copy of it." Companion/Numerology's own Premium interpretation caps at 1
 * memory reference per turn; Reports draws on more sections but must still stay small and
 * explicit rather than unbounded — starting at 3, documented as a starting point pending real
 * measurement, per the locked decision's own instruction not to guess a large number. */
const MEMORY_RETRIEVAL_LIMIT = 3;

/**
 * Builds the immutable `ReportSourceSnapshot` at generation time (locked decision #9). Only ever
 * reads Natal Chart, Numerology (required), and bounded Tarot/Memory (optional) — no Journal, no
 * frozen-module import of any kind (locked decision #3/#7 — verified by this file's own import
 * list, not just by convention).
 */
@Injectable()
export class ReportSnapshotService {
  private readonly logger = new Logger('ReportSnapshot');

  constructor(
    private readonly prisma: PrismaService,
    private readonly memoryRetrieval: MemoryRetrievalService,
  ) {}

  async build(userId: string, natalChartId: string, numerologyReadingId: string): Promise<ReportSourceSnapshot> {
    const [natalChart, numerology, tarot, memory] = await Promise.all([
      this.buildNatalChartSnapshot(natalChartId),
      this.buildNumerologySnapshot(numerologyReadingId),
      this.buildTarotSnapshot(userId),
      this.buildMemorySnapshot(userId),
    ]);

    return { natalChart, numerology, tarot, memory };
  }

  private async buildNatalChartSnapshot(natalChartId: string): Promise<ReportSourceSnapshot['natalChart']> {
    const chart = await this.prisma.natalChart.findUniqueOrThrow({
      where: { id: natalChartId },
      include: { placements: true, aspects: true },
    });

    const ascendant =
      chart.ascendantSign && chart.ascendantDegreeInSign !== null
        ? { sign: fromPrismaSign(chart.ascendantSign), degreeInSign: chart.ascendantDegreeInSign }
        : null;
    const midheaven =
      chart.midheavenSign && chart.midheavenDegreeInSign !== null
        ? { sign: fromPrismaSign(chart.midheavenSign), degreeInSign: chart.midheavenDegreeInSign }
        : null;

    return {
      sourceId: chart.id,
      calculationVersion: chart.calculationVersion,
      engineVersion: chart.engineVersion,
      ascendant: ascendant ? { sign: ascendant.sign, degreeInSign: ascendant.degreeInSign } : null,
      midheaven: midheaven ? { sign: midheaven.sign, degreeInSign: midheaven.degreeInSign } : null,
      placements: chart.placements.map((p) => {
        const body = fromPrismaPlanet(p.body);
        const sign = fromPrismaSign(p.sign);
        return {
          body,
          sign,
          degreeInSign: p.degreeInSign,
          house: p.house,
          retrograde: p.retrograde,
          meaning: composePlacementMeaning(body, sign, p.house),
        };
      }),
      aspects: chart.aspects.map((a) => {
        const pointA = fromPrismaPoint(a.pointA);
        const pointB = fromPrismaPoint(a.pointB);
        const type = fromPrismaAspectType(a.type);
        return { pointA, pointB, type, meaning: composeAspectMeaning(pointA, pointB, type) };
      }),
    };
  }

  private async buildNumerologySnapshot(numerologyReadingId: string): Promise<ReportSourceSnapshot['numerology']> {
    const reading = await this.prisma.numerologyReading.findUniqueOrThrow({
      where: { id: numerologyReadingId },
      include: { values: true },
    });

    return {
      sourceId: reading.id,
      calculationVersion: reading.calculationVersion,
      values: reading.values.map((v) => {
        const type = v.type as NumerologyValueType;
        const meaning = getNumerologyMeaning(type, v.value);
        return {
          type,
          value: v.value,
          isMasterNumber: v.isMasterNumber,
          meaning: meaning ? `${meaning.title} — ${meaning.meaning}` : '',
        };
      }),
    };
  }

  /** Optional enrichment — never blocks generation, never a required field. Bounded per
   * `ReportReadinessService`'s own lookback constants, so readiness's "available" count and the
   * snapshot actually built here can never silently diverge. */
  private async buildTarotSnapshot(userId: string): Promise<ReportTarotSnapshot[] | null> {
    const lookbackStart = new Date(Date.now() - TAROT_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
    const readings = await this.prisma.tarotReading.findMany({
      where: { userId, status: 'ACTIVE', createdAt: { gte: lookbackStart } },
      include: { cards: { include: { card: true } } },
      orderBy: { createdAt: 'desc' },
      take: TAROT_LOOKBACK_COUNT,
    });
    if (readings.length === 0) return null;

    return readings.map((r) => ({
      sourceId: r.id,
      drawnAt: r.createdAt.toISOString(),
      type: r.type,
      cards: [...r.cards]
        .sort((a, b) => a.position - b.position)
        .map((c) => ({ name: c.card.name, isReversed: c.isReversed, positionLabel: c.positionLabel })),
    }));
  }

  /** Optional enrichment — existing consent/retrieval reused verbatim (locked decision #6). Never
   * a calculated fact; failure here never blocks generation (mirrors Numerology/Tarot's own
   * "Memory retrieval failing never blocks a reading" precedent). */
  private async buildMemorySnapshot(userId: string): Promise<ReportMemorySnapshot[] | null> {
    try {
      const recommended = await this.memoryRetrieval.recommend(userId, { limit: MEMORY_RETRIEVAL_LIMIT });
      if (recommended.items.length === 0) return null;
      return recommended.items.map((item) => ({ title: item.title, summary: item.summary }));
    } catch (error) {
      this.logger.warn(`Memory retrieval failed while building report snapshot: ${error instanceof Error ? error.message : 'unknown'}`);
      return null;
    }
  }
}
