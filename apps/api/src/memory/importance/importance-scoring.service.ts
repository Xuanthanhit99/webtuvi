import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { Memory, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { MemoryImportanceCalculator, explainImportanceFactors, type ImportanceScoreResult } from './memory-importance.calculator';
import { significantTokens, jaccardSimilarity } from '../shared/text-normalization.util';

/** Two memories of the same type "reinforce" each other for recurrence scoring when their
 * significant-token overlap is at least this — deliberately looser than the duplicate
 * detector's TYPE_SPECIFIC threshold (0.6, see MemoryDuplicateService), since recurrence is
 * meant to catch "the user has brought this topic up again," not "these are the same memory." */
const RECURRENCE_SIMILARITY_THRESHOLD = 0.3;

/** Bounds how many of the user's other ACCEPTED memories are scanned for recurrence — matches
 * MemoryDuplicateService's cap; see docs/architecture/memory-intelligence.md "Known limitations". */
const RECURRENCE_SCAN_LIMIT = 500;

export interface ImportanceExplanationDto {
  score: number;
  factors: Record<string, number>;
  /** Plain-language sentences, one per non-zero factor — Phase 10 requires the frontend never
   * show a raw score without this. */
  explanations: string[];
}

/**
 * Recomputes and persists the deterministic 0-100 importance score for a Memory. No AI is
 * involved anywhere in this service — see MemoryImportanceCalculator for the pure scoring
 * function and docs/architecture/memory-intelligence.md for the documented weight table.
 */
@Injectable()
export class ImportanceScoringService {
  private readonly logger = new Logger('ImportanceScoring');

  constructor(private readonly prisma: PrismaService) {}

  /** Recomputes and persists the score for one memory (ownership-checked) and returns the
   * full explanation. Used by the recommendation endpoint and available for the memory detail
   * view to refresh a stale score on demand. */
  async recompute(userId: string, memoryId: string): Promise<ImportanceExplanationDto> {
    const memory = await this.prisma.memory.findFirst({ where: { id: memoryId, userId } });
    if (!memory) {
      throw new NotFoundException({ code: 'MEMORY_NOT_FOUND', message: 'That memory was not found.' });
    }
    const result = await this.scoreOne(userId, memory);
    await this.persist(memory.id, result);
    return this.toExplanationDto(result);
  }

  /** Recomputes and persists scores for every ACCEPTED memory the user owns — bounded by
   * RECURRENCE_SCAN_LIMIT, consistent with the rest of this sprint's synchronous,
   * no-background-job design (see memory-intelligence.md "Known limitations"). */
  async recomputeAllForUser(userId: string): Promise<number> {
    const memories = await this.prisma.memory.findMany({
      where: { userId, status: 'ACCEPTED' },
      orderBy: { createdAt: 'desc' },
      take: RECURRENCE_SCAN_LIMIT,
    });

    let updated = 0;
    for (const memory of memories) {
      const result = await this.scoreOne(userId, memory, memories);
      await this.persist(memory.id, result);
      updated += 1;
    }
    this.logger.log(`Recomputed importance for ${updated} memories`);
    return updated;
  }

  /** Pure-ish scoring for one memory given an optional pre-fetched pool to compute recurrence
   * against (avoids an N+1 query when scoring a whole user's memories at once). */
  private async scoreOne(userId: string, memory: Memory, pool?: Memory[]): Promise<ImportanceScoreResult> {
    const siblings = pool ?? (await this.prisma.memory.findMany({
      where: { userId, status: 'ACCEPTED', id: { not: memory.id } },
      orderBy: { createdAt: 'desc' },
      take: RECURRENCE_SCAN_LIMIT,
    }));

    const recurrenceCount = countRecurrences(memory, siblings);
    const payload = (memory.structuredPayload as Record<string, unknown> | null) ?? null;

    return MemoryImportanceCalculator.calculate({
      type: memory.type,
      sourceType: memory.sourceType,
      pinned: memory.pinned,
      explicitEmphasis: payload?.emphasis === true,
      explicitFutureRelevance: payload?.futureRelevance === true,
      recurrenceCount,
      createdAt: memory.createdAt,
      lastReferencedAt: memory.lastReferencedAt,
    });
  }

  private async persist(memoryId: string, result: ImportanceScoreResult): Promise<void> {
    await this.prisma.memory.update({
      where: { id: memoryId },
      data: {
        importanceScore: result.score,
        importanceFactors: result.factors as Prisma.InputJsonValue,
      },
    });
  }

  private toExplanationDto(result: ImportanceScoreResult): ImportanceExplanationDto {
    return { score: result.score, factors: result.factors, explanations: explainImportanceFactors(result.factors) };
  }
}

function countRecurrences(memory: Memory, siblings: Memory[]): number {
  const memoryTokens = significantTokens(`${memory.title} ${memory.summary}`);
  if (memoryTokens.length === 0) return 0;

  let count = 0;
  for (const sibling of siblings) {
    if (sibling.id === memory.id || sibling.type !== memory.type) continue;
    const siblingTokens = significantTokens(`${sibling.title} ${sibling.summary}`);
    if (jaccardSimilarity(memoryTokens, siblingTokens) >= RECURRENCE_SIMILARITY_THRESHOLD) {
      count += 1;
    }
  }
  return count;
}
