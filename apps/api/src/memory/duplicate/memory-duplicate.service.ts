import { Injectable, Logger } from '@nestjs/common';
import type { Memory, MemoryDuplicate } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { classifyDuplicate, orderPair, type DuplicateMatch } from './memory-duplicate.util';

/** Bounds the O(n^2) pairwise scan — see docs/architecture/memory-intelligence.md
 * "Known limitations". Grouped by type first, so the true cost is closer to
 * O(sum(groupSize^2)), not O(n^2) across all types. */
const SCAN_LIMIT = 200;

export interface MemoryDuplicatePairDto {
  id: string;
  memoryAId: string;
  memoryBId: string;
  matchType: DuplicateMatch['matchType'];
  similarity: number;
  reason: string;
  status: MemoryDuplicate['status'];
  detectedAt: string;
}

/**
 * Deterministic, on-demand duplicate detection (no embeddings, no background job — see
 * memory-engine.md's synchronous-by-design precedent from Sprint 3A's export). Findings are
 * cached as `MemoryDuplicate` rows so a user's DISMISSED decision is remembered across calls;
 * findings for pairs that no longer classify as duplicates (e.g. a title was edited) are
 * cleaned up on the next detection pass, but only while still PENDING — a DISMISSED/MERGED
 * row is a user decision and is never silently resurrected or deleted out from under it.
 */
@Injectable()
export class MemoryDuplicateService {
  private readonly logger = new Logger('MemoryDuplicate');

  constructor(private readonly prisma: PrismaService) {}

  async detectForUser(userId: string): Promise<MemoryDuplicatePairDto[]> {
    const memories = await this.prisma.memory.findMany({
      where: { userId, status: 'ACCEPTED' },
      orderBy: { createdAt: 'desc' },
      take: SCAN_LIMIT,
    });

    const byType = new Map<string, Memory[]>();
    for (const memory of memories) {
      const group = byType.get(memory.type) ?? [];
      group.push(memory);
      byType.set(memory.type, group);
    }

    const currentPairs = new Map<string, DuplicateMatch>();
    for (const group of byType.values()) {
      for (let i = 0; i < group.length; i += 1) {
        for (let j = i + 1; j < group.length; j += 1) {
          const match = classifyDuplicate(toCandidate(group[i]!), toCandidate(group[j]!));
          if (!match) continue;
          const [memoryAId, memoryBId] = orderPair(group[i]!.id, group[j]!.id);
          currentPairs.set(pairKey(memoryAId, memoryBId), match);
        }
      }
    }

    const existing = await this.prisma.memoryDuplicate.findMany({ where: { userId } });
    const existingByPair = new Map(existing.map((row) => [pairKey(row.memoryAId, row.memoryBId), row]));

    const results: MemoryDuplicatePairDto[] = [];

    for (const [key, match] of currentPairs) {
      const [memoryAId, memoryBId] = key.split('::') as [string, string];
      const existingRow = existingByPair.get(key);

      if (existingRow && existingRow.status !== 'PENDING') {
        // User already dismissed or merged this pair — respected, not resurrected.
        continue;
      }

      const row = existingRow
        ? await this.prisma.memoryDuplicate.update({
            where: { id: existingRow.id },
            data: { matchType: match.matchType, similarity: match.similarity },
          })
        : await this.prisma.memoryDuplicate.create({
            data: { userId, memoryAId, memoryBId, matchType: match.matchType, similarity: match.similarity },
          });

      results.push(toDto(row, match.reason));
    }

    // Clean up stale PENDING rows for pairs that no longer classify as duplicates (content
    // changed, or a memory was archived/deleted out of the ACCEPTED scan set).
    const stalePendingIds = existing
      .filter((row) => row.status === 'PENDING' && !currentPairs.has(pairKey(row.memoryAId, row.memoryBId)))
      .map((row) => row.id);
    if (stalePendingIds.length > 0) {
      await this.prisma.memoryDuplicate.deleteMany({ where: { id: { in: stalePendingIds } } });
    }

    this.logger.log(`Duplicate scan: ${memories.length} memories, ${results.length} pending duplicates`);
    return results;
  }

  async markMerged(userId: string, memoryAId: string, memoryBId: string): Promise<void> {
    await this.setPairStatus(userId, memoryAId, memoryBId, 'MERGED');
  }

  async dismissPair(userId: string, memoryAId: string, memoryBId: string): Promise<void> {
    await this.setPairStatus(userId, memoryAId, memoryBId, 'DISMISSED');
  }

  private async setPairStatus(
    userId: string,
    memoryAId: string,
    memoryBId: string,
    status: 'MERGED' | 'DISMISSED',
  ): Promise<void> {
    const [a, b] = orderPair(memoryAId, memoryBId);
    await this.prisma.memoryDuplicate.updateMany({
      where: { userId, memoryAId: a, memoryBId: b },
      data: { status, resolvedAt: new Date() },
    });
  }
}

function pairKey(a: string, b: string): string {
  return `${a}::${b}`;
}

function toCandidate(memory: Memory) {
  return {
    id: memory.id,
    type: memory.type,
    title: memory.title,
    summary: memory.summary,
    structuredPayload: (memory.structuredPayload as Record<string, unknown> | null) ?? null,
  };
}

function toDto(row: MemoryDuplicate, reason: string): MemoryDuplicatePairDto {
  return {
    id: row.id,
    memoryAId: row.memoryAId,
    memoryBId: row.memoryBId,
    matchType: row.matchType,
    similarity: row.similarity,
    reason,
    status: row.status,
    detectedAt: row.detectedAt.toISOString(),
  };
}
