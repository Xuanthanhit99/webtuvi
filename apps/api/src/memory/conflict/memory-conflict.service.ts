import { Injectable, Logger } from '@nestjs/common';
import type { Memory, MemoryConflict } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { classifyConflict } from './memory-conflict.util';
import { orderPair } from '../duplicate/memory-duplicate.util';

/** Same bound as MemoryDuplicateService's scan — see memory-intelligence.md "Known limitations". */
const SCAN_LIMIT = 200;

export interface MemoryConflictDto {
  id: string;
  memoryAId: string;
  memoryBId: string;
  status: MemoryConflict['status'];
  reason: string;
  detectedAt: string;
}

/**
 * Deterministic, on-demand conflict detection between a user's own ACCEPTED memories. Never
 * overwrites or deletes a memory — a detected conflict is purely an additional, read-only
 * annotation (Phase 9 exposes `GET /memory/conflicts` only, no resolve mutation this sprint).
 * See docs/architecture/memory-intelligence.md "Conflict policy" and classifyConflict for the
 * exact rules.
 */
@Injectable()
export class MemoryConflictService {
  private readonly logger = new Logger('MemoryConflict');

  constructor(private readonly prisma: PrismaService) {}

  async detectForUser(userId: string): Promise<MemoryConflictDto[]> {
    const memories = await this.prisma.memory.findMany({
      where: { userId, status: 'ACCEPTED' },
      orderBy: { createdAt: 'asc' },
      take: SCAN_LIMIT,
    });

    const byType = new Map<string, Memory[]>();
    for (const memory of memories) {
      const group = byType.get(memory.type) ?? [];
      group.push(memory);
      byType.set(memory.type, group);
    }

    const current = new Map<string, { status: 'CONFLICT' | 'SUPERSEDED'; reason: string; olderId: string; newerId: string }>();
    for (const group of byType.values()) {
      for (let i = 0; i < group.length; i += 1) {
        for (let j = i + 1; j < group.length; j += 1) {
          const older = group[i]!;
          const newer = group[j]!;
          const match = classifyConflict(toCandidate(older), toCandidate(newer));
          if (!match) continue;
          const [memoryAId, memoryBId] = orderPair(older.id, newer.id);
          current.set(pairKey(memoryAId, memoryBId), { ...match, olderId: older.id, newerId: newer.id });
        }
      }
    }

    const existing = await this.prisma.memoryConflict.findMany({ where: { userId } });
    const existingByPair = new Map(existing.map((row) => [pairKey(row.memoryAId, row.memoryBId), row]));

    const results: MemoryConflictDto[] = [];
    for (const [key, match] of current) {
      const [memoryAId, memoryBId] = key.split('::') as [string, string];
      const existingRow = existingByPair.get(key);

      const row = existingRow
        ? await this.prisma.memoryConflict.update({
            where: { id: existingRow.id },
            data: { status: match.status, reason: match.reason },
          })
        : await this.prisma.memoryConflict.create({
            data: { userId, memoryAId, memoryBId, status: match.status, reason: match.reason },
          });

      results.push(toDto(row));
    }

    const staleIds = existing
      .filter((row) => !current.has(pairKey(row.memoryAId, row.memoryBId)))
      .map((row) => row.id);
    if (staleIds.length > 0) {
      await this.prisma.memoryConflict.deleteMany({ where: { id: { in: staleIds } } });
    }

    this.logger.log(`Conflict scan: ${memories.length} memories, ${results.length} active conflicts`);
    return results;
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

function toDto(row: MemoryConflict): MemoryConflictDto {
  return {
    id: row.id,
    memoryAId: row.memoryAId,
    memoryBId: row.memoryBId,
    status: row.status,
    reason: row.reason,
    detectedAt: row.detectedAt.toISOString(),
  };
}
