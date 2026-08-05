import { Injectable, Logger } from '@nestjs/common';
import type { MemoryType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { MemoryConsentService } from '../../memory/consent/memory-consent.service';

/**
 * Phase 11 privacy enforcement: "if a Memory or Journal entry is deleted, associated Reflection
 * Candidates must become invalid automatically." Compute-on-read, like everything else this
 * sprint — no background sweep. `MEMORY` sources are invalidated by either a hard delete (the row
 * is gone) or a since-revoked type consent (mirrors MemoryRetrievalService's own "re-checked
 * against current settings, not the acceptance-time snapshot" policy — a Memory whose type is now
 * DENY_TYPE/DISABLED must not keep backing an already-generated candidate any more than it can
 * seed a new one, see ReflectionDataSourceService). `JOURNAL` sources are invalidated by a soft
 * delete (`state: 'DELETED'`, row persists but is no longer visible to anyone but its owner via
 * the dedicated recovery view). `ACTIVITY` and `COMPANION` sources have no deletion or consent
 * pathway in this codebase today, so there is nothing to revalidate for them — checking anyway
 * would be dead code asserting a guarantee the schema doesn't need yet.
 */
@Injectable()
export class ReflectionValidityService {
  private readonly logger = new Logger('ReflectionValidity');

  constructor(
    private readonly prisma: PrismaService,
    private readonly memoryConsent: MemoryConsentService,
  ) {}

  async revalidateForUser(userId: string): Promise<void> {
    const candidates = await this.prisma.reflectionCandidate.findMany({
      where: { userId, state: { in: ['NEW', 'READY'] } },
      include: { sources: true },
    });
    if (candidates.length === 0) return;

    const memoryIds = new Set<string>();
    const journalIds = new Set<string>();
    for (const candidate of candidates) {
      for (const source of candidate.sources) {
        if (source.sourceType === 'MEMORY') memoryIds.add(source.sourceId);
        if (source.sourceType === 'JOURNAL') journalIds.add(source.sourceId);
      }
    }

    const [memories, journals] = await Promise.all([
      memoryIds.size > 0
        ? this.prisma.memory.findMany({ where: { id: { in: [...memoryIds] } }, select: { id: true, type: true } })
        : Promise.resolve([]),
      journalIds.size > 0
        ? this.prisma.journalEntry.findMany({ where: { id: { in: [...journalIds] } }, select: { id: true, state: true } })
        : Promise.resolve([]),
    ]);

    const allowedByType = await this.consentByType(
      userId,
      [...new Set(memories.map((m) => m.type))],
    );
    const validMemoryIds = new Set(memories.filter((m) => allowedByType.get(m.type) === true).map((m) => m.id));
    const journalStateById = new Map(journals.map((j) => [j.id, j.state]));

    const staleIds = candidates
      .filter((candidate) =>
        candidate.sources.some((source) => {
          if (source.sourceType === 'MEMORY') return !validMemoryIds.has(source.sourceId);
          if (source.sourceType === 'JOURNAL') {
            const state = journalStateById.get(source.sourceId);
            return state === undefined || state === 'DELETED';
          }
          return false;
        }),
      )
      .map((candidate) => candidate.id);

    if (staleIds.length === 0) return;

    await this.prisma.reflectionCandidate.updateMany({
      where: { id: { in: staleIds } },
      data: { state: 'EXPIRED', expiredAt: new Date() },
    });
    this.logger.log(`Reflection validity: expired ${staleIds.length} candidate(s) with deleted/invalid/consent-revoked sources`);
  }

  /** One canAccept() call per distinct type present, not per row — mirrors
   * MemoryRetrievalService.filterByCurrentConsent. */
  private async consentByType(userId: string, types: MemoryType[]): Promise<Map<MemoryType, boolean>> {
    const allowedByType = new Map<MemoryType, boolean>();
    for (const type of types) {
      const decision = await this.memoryConsent.canAccept(userId, type);
      allowedByType.set(type, decision.allowed);
    }
    return allowedByType;
  }
}
