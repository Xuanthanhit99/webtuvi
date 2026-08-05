import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { InsightUserData } from '../insight.types';

/** Same order of magnitude as Reflection Foundation's own bound (200 candidates) and Memory
 * Intelligence's own O(n²) pairwise-scan bound — fine at this sprint's expected scale. */
const REFLECTION_BOUND = 200;
/** How far back the Relationship Engine looks — matches Reflection's own 180-day lookback so
 * Insight Preparation never considers a Reflection Candidate that data source itself wouldn't
 * currently regenerate. */
const LOOKBACK_DAYS = 180;

/**
 * Fetches one bounded, deterministic snapshot of a user's Reflection Candidates for Insight
 * Preparation (Phase 0/2/3/4). Deliberately reads only `ReflectionCandidate` rows — never
 * Journal/Memory/Activity/Companion directly, see docs/progress/sprint-4c-progress.md "Deliberate
 * scope decisions". `EXPIRED` candidates are excluded outright: a Reflection Candidate Reflection
 * Foundation itself has already flagged as citing an invalid/deleted/consent-revoked source can
 * never become Insight evidence.
 */
@Injectable()
export class InsightDataSourceService {
  constructor(private readonly prisma: PrismaService) {}

  async fetch(userId: string): Promise<InsightUserData> {
    const since = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000);

    const reflections = await this.prisma.reflectionCandidate.findMany({
      where: { userId, state: { not: 'EXPIRED' }, createdAt: { gte: since } },
      include: { sources: true },
      orderBy: { createdAt: 'desc' },
      take: REFLECTION_BOUND,
    });

    const memoryIds = new Set<string>();
    for (const reflection of reflections) {
      for (const source of reflection.sources) {
        if (source.sourceType === 'MEMORY') memoryIds.add(source.sourceId);
      }
    }

    const memories = memoryIds.size > 0
      ? await this.prisma.memory.findMany({
          where: { id: { in: [...memoryIds] } },
          select: { id: true, importanceScore: true },
        })
      : [];

    return {
      userId,
      reflections,
      memoryImportanceById: new Map(memories.map((m) => [m.id, m.importanceScore])),
    };
  }
}
