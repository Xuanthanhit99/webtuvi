import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { Memory, MemoryMergeSuggestion, MemoryMergeSuggestionStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { MemoryDuplicateService, type MemoryDuplicatePairDto } from '../duplicate/memory-duplicate.service';
import { MemoryRecordService } from '../record/memory-record.service';

const CONFIDENCE_BY_MATCH_TYPE: Record<MemoryDuplicatePairDto['matchType'], number> = {
  EXACT: 99,
  NORMALIZED: 95,
  STRUCTURED: 75,
  TYPE_SPECIFIC: 0, // computed from similarity instead — see confidenceFor()
};

function confidenceFor(pair: MemoryDuplicatePairDto): number {
  if (pair.matchType === 'TYPE_SPECIFIC') {
    return Math.min(85, pair.similarity);
  }
  return CONFIDENCE_BY_MATCH_TYPE[pair.matchType];
}

export interface MergeSuggestionDto {
  id: string;
  primaryMemoryId: string;
  primaryTitle: string;
  duplicateMemoryId: string;
  duplicateTitle: string;
  confidence: number;
  reason: string;
  status: MemoryMergeSuggestionStatus;
  createdAt: string;
}

/**
 * Generates merge suggestions from MemoryDuplicateService's findings — never merges
 * automatically. `accept()`/`reject()` are the only two ways a suggestion is resolved, and
 * both require an explicit, ownership-checked user action (Phase 4/9). Accepting archives the
 * duplicate memory (Sprint 3A's existing, reversible archive — never a hard delete, never
 * synthesized/rewritten content) and keeps the primary; this sprint does not generate merged
 * content. See docs/architecture/memory-intelligence.md "Merge policy".
 */
@Injectable()
export class MemoryMergeSuggestionService {
  private readonly logger = new Logger('MemoryMergeSuggestion');

  constructor(
    private readonly prisma: PrismaService,
    private readonly duplicates: MemoryDuplicateService,
    private readonly records: MemoryRecordService,
  ) {}

  /** Refreshes duplicate detection, then creates a merge suggestion for any PENDING duplicate
   * pair that doesn't already have one (in either primary/duplicate order) — a previously
   * accepted/rejected suggestion for the same pair is never regenerated. */
  async generateForUser(userId: string): Promise<MergeSuggestionDto[]> {
    const pendingDuplicates = await this.duplicates.detectForUser(userId);
    if (pendingDuplicates.length === 0) {
      return this.list(userId);
    }

    const memoryIds = [...new Set(pendingDuplicates.flatMap((d) => [d.memoryAId, d.memoryBId]))];
    const memories = await this.prisma.memory.findMany({ where: { id: { in: memoryIds }, userId } });
    const memoryById = new Map(memories.map((m) => [m.id, m]));

    let created = 0;
    for (const pair of pendingDuplicates) {
      const a = memoryById.get(pair.memoryAId);
      const b = memoryById.get(pair.memoryBId);
      if (!a || !b) continue; // memory since archived/deleted out from under a stale duplicate row

      const alreadyExists = await this.prisma.memoryMergeSuggestion.findFirst({
        where: {
          userId,
          OR: [
            { primaryMemoryId: a.id, duplicateMemoryId: b.id },
            { primaryMemoryId: b.id, duplicateMemoryId: a.id },
          ],
        },
      });
      if (alreadyExists) continue;

      const [primary, duplicate] = choosePrimary(a, b);
      await this.prisma.memoryMergeSuggestion.create({
        data: {
          userId,
          primaryMemoryId: primary.id,
          duplicateMemoryId: duplicate.id,
          confidence: confidenceFor(pair),
          reason: pair.reason,
        },
      });
      created += 1;
    }

    this.logger.log(`Merge suggestion generation: ${pendingDuplicates.length} duplicates, ${created} new suggestions created`);
    return this.list(userId);
  }

  async list(userId: string): Promise<MergeSuggestionDto[]> {
    const rows = await this.prisma.memoryMergeSuggestion.findMany({
      where: { userId, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    });
    if (rows.length === 0) return [];

    const memoryIds = [...new Set(rows.flatMap((r) => [r.primaryMemoryId, r.duplicateMemoryId]))];
    const memories = await this.prisma.memory.findMany({ where: { id: { in: memoryIds }, userId } });
    const titleById = new Map(memories.map((m) => [m.id, m.title]));

    return rows.map((row) => toDto(row, titleById));
  }

  async accept(userId: string, id: string): Promise<MergeSuggestionDto> {
    const row = await this.findOwnedPending(userId, id);

    await this.prisma.$transaction(async (tx) => {
      await tx.memoryMergeSuggestion.update({
        where: { id },
        data: { status: 'ACCEPTED', resolvedAt: new Date() },
      });
    });
    await this.duplicates.markMerged(userId, row.primaryMemoryId, row.duplicateMemoryId);
    await this.records.archive(userId, row.duplicateMemoryId);

    this.logger.log(`Merge suggestion ${id} accepted — duplicate memory archived`);
    const updated = await this.prisma.memoryMergeSuggestion.findUniqueOrThrow({ where: { id } });
    return toDto(updated, await this.titleMap(userId, [updated.primaryMemoryId, updated.duplicateMemoryId]));
  }

  async reject(userId: string, id: string): Promise<MergeSuggestionDto> {
    const row = await this.findOwnedPending(userId, id);

    await this.prisma.memoryMergeSuggestion.update({
      where: { id },
      data: { status: 'REJECTED', resolvedAt: new Date() },
    });
    await this.duplicates.dismissPair(userId, row.primaryMemoryId, row.duplicateMemoryId);

    const updated = await this.prisma.memoryMergeSuggestion.findUniqueOrThrow({ where: { id } });
    return toDto(updated, await this.titleMap(userId, [updated.primaryMemoryId, updated.duplicateMemoryId]));
  }

  private async findOwnedPending(userId: string, id: string): Promise<MemoryMergeSuggestion> {
    const row = await this.prisma.memoryMergeSuggestion.findFirst({ where: { id, userId } });
    if (!row) {
      throw new NotFoundException({ code: 'MERGE_SUGGESTION_NOT_FOUND', message: 'That merge suggestion was not found.' });
    }
    if (row.status !== 'PENDING') {
      throw new ConflictException({ code: 'MERGE_SUGGESTION_ALREADY_RESOLVED', message: 'This suggestion was already resolved.' });
    }
    return row;
  }

  private async titleMap(userId: string, ids: string[]): Promise<Map<string, string>> {
    const memories = await this.prisma.memory.findMany({ where: { id: { in: ids }, userId } });
    return new Map(memories.map((m) => [m.id, m.title]));
  }
}

/** Deterministic primary/duplicate assignment: prefer the higher importanceScore, then pinned,
 * then the older (earlier createdAt) memory, then id — so re-running generation for the same
 * pair always yields the same primary, keeping the unique (primaryMemoryId, duplicateMemoryId)
 * constraint stable. */
function choosePrimary(a: Memory, b: Memory): [Memory, Memory] {
  if (a.importanceScore !== b.importanceScore) return a.importanceScore > b.importanceScore ? [a, b] : [b, a];
  if (a.pinned !== b.pinned) return a.pinned ? [a, b] : [b, a];
  if (a.createdAt.getTime() !== b.createdAt.getTime()) return a.createdAt < b.createdAt ? [a, b] : [b, a];
  return a.id < b.id ? [a, b] : [b, a];
}

function toDto(row: MemoryMergeSuggestion, titleById: Map<string, string>): MergeSuggestionDto {
  return {
    id: row.id,
    primaryMemoryId: row.primaryMemoryId,
    primaryTitle: titleById.get(row.primaryMemoryId) ?? '(memory no longer available)',
    duplicateMemoryId: row.duplicateMemoryId,
    duplicateTitle: titleById.get(row.duplicateMemoryId) ?? '(memory no longer available)',
    confidence: row.confidence,
    reason: row.reason,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  };
}
