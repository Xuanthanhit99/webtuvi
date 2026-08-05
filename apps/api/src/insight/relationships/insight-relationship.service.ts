import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { InsightRelationshipType, ReflectionCandidate } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { orderPair } from '../../memory/duplicate/memory-duplicate.util';
import { classifyRelationship } from './insight-relationship.util';

/** Same bound Memory Intelligence uses for its own O(n²) pairwise scans within a group. */
const SCAN_LIMIT_PER_CATEGORY = 200;

/**
 * Deterministic, on-demand relationship detection between a user's own Reflection Candidates
 * (Phase 2). Compute-on-read — no background job, mirrors MemoryConflictService/
 * MemoryDuplicateService's own precedent exactly, including "grouped by category first" to keep
 * the pairwise scan bounded (classifyRelationship's own two branches both require the pair share
 * either `groupKey` or `category`, so cross-category comparisons can never match and are skipped
 * entirely).
 */
@Injectable()
export class InsightRelationshipService {
  private readonly logger = new Logger('InsightRelationship');

  constructor(private readonly prisma: PrismaService) {}

  async detectForUser(userId: string, reflections: ReflectionCandidate[]): Promise<void> {
    const byCategory = new Map<string, ReflectionCandidate[]>();
    for (const reflection of reflections) {
      const group = byCategory.get(reflection.category) ?? [];
      group.push(reflection);
      byCategory.set(reflection.category, group);
    }

    const current = new Map<string, { reflectionAId: string; reflectionBId: string; type: InsightRelationshipType; reason: string }>();
    for (const group of byCategory.values()) {
      const bounded = group.slice(0, SCAN_LIMIT_PER_CATEGORY);
      for (let i = 0; i < bounded.length; i += 1) {
        for (let j = i + 1; j < bounded.length; j += 1) {
          const match = classifyRelationship(bounded[i]!, bounded[j]!);
          if (!match) continue;
          const [reflectionAId, reflectionBId] = orderPair(bounded[i]!.id, bounded[j]!.id);
          current.set(pairKey(reflectionAId, reflectionBId), { reflectionAId, reflectionBId, type: match.type, reason: match.reason });
        }
      }
    }

    const existing = await this.prisma.insightRelationship.findMany({ where: { userId } });
    const existingByPair = new Map(existing.map((row) => [pairKey(row.reflectionAId, row.reflectionBId), row]));

    for (const [key, match] of current) {
      const existingRow = existingByPair.get(key);
      if (existingRow) {
        if (existingRow.type !== match.type || existingRow.reason !== match.reason) {
          try {
            await this.prisma.insightRelationship.update({
              where: { id: existingRow.id },
              data: { type: match.type, reason: match.reason },
            });
          } catch (error) {
            // A concurrent pass for the same user already deleted this row as stale (its own
            // `current` set, computed from a slightly different reflection snapshot, didn't
            // include this pair). That's a legitimate outcome, not a bug — nothing to update.
            if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2025') throw error;
          }
        }
      } else {
        // Concurrent requests for the same user (e.g. the frontend firing list + statistics in
        // parallel) can both read `existing` before either writes and both decide this pair is
        // missing. `upsert` on the compound unique key makes the write atomic at the DB level
        // instead of racing two `create()` calls into a unique-constraint violation — the loser
        // of the race just applies its (identical, deterministically-computed) type/reason as an
        // update instead of throwing.
        await this.prisma.insightRelationship.upsert({
          where: { reflectionAId_reflectionBId: { reflectionAId: match.reflectionAId, reflectionBId: match.reflectionBId } },
          create: {
            userId,
            reflectionAId: match.reflectionAId,
            reflectionBId: match.reflectionBId,
            type: match.type,
            reason: match.reason,
          },
          update: {
            type: match.type,
            reason: match.reason,
          },
        });
      }
    }

    const staleIds = existing.filter((row) => !current.has(pairKey(row.reflectionAId, row.reflectionBId))).map((row) => row.id);
    if (staleIds.length > 0) {
      await this.prisma.insightRelationship.deleteMany({ where: { id: { in: staleIds } } });
    }

    this.logger.log(`Relationship scan: ${reflections.length} reflections, ${current.size} active relationships`);
  }
}

function pairKey(a: string, b: string): string {
  return `${a}::${b}`;
}
