import { Injectable, Logger } from '@nestjs/common';
import type { ReflectionState, ReflectionTrigger } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ReflectionDataSourceService } from '../sources/reflection-data-source.service';
import { ReflectionRuleEngine } from '../rules/reflection-rule-engine.service';
import { ReflectionScoreService } from '../scoring/reflection-score.service';
import type { ReflectionRuleFinding } from '../reflection.types';

const DAY_MS = 24 * 60 * 60 * 1000;
const RESOLVED_STATES: ReflectionState[] = ['DISMISSED', 'ARCHIVED', 'EXPIRED'];

/** Trigger whose evidence describes a *current* state (an ongoing gap) rather than a fixed,
 * historical fact. If a fresh generation pass no longer finds this rule firing, any previous
 * still-open (NEW/READY) candidate for it is stale — the inactivity it asserted has ended — and
 * is expired rather than left to claim something no longer true. Every other trigger describes a
 * historical fact (a streak that happened, a topic that was mentioned) which stays true even
 * after the moment passes, so only this one gets this treatment. See
 * docs/architecture/reflection-foundation.md "Generation" for the full rationale. */
const CURRENCY_SENSITIVE_TRIGGERS: ReflectionTrigger[] = ['LONG_INACTIVITY'];

function buildDedupeKey(finding: ReflectionRuleFinding): string {
  return `${finding.trigger}:${finding.groupKey}:${finding.windowStart.toISOString()}`;
}

/**
 * Orchestrates Phases 2-5: fetch data -> run rules -> score -> persist. Compute-on-read, not a
 * background job — `ensureGenerated()` runs synchronously inside every Reflection read endpoint
 * (mirrors MemoryDuplicateService/MemoryMergeSuggestionService's own "compute-on-read" precedent,
 * see docs/progress/sprint-4b-progress.md "Deliberate scope decisions"). Never resurrects a
 * candidate the user already DISMISSED/ARCHIVED, or one ReflectionValidityService has already
 * EXPIRED for the same rule+group+window fingerprint (`dedupeKey`).
 */
@Injectable()
export class ReflectionGenerationService {
  private readonly logger = new Logger('ReflectionGeneration');

  constructor(
    private readonly prisma: PrismaService,
    private readonly dataSource: ReflectionDataSourceService,
    private readonly ruleEngine: ReflectionRuleEngine,
    private readonly scoreService: ReflectionScoreService,
  ) {}

  async ensureGenerated(userId: string): Promise<void> {
    const startedAt = Date.now();
    const data = await this.dataSource.fetch(userId);
    const findings = this.ruleEngine.run(data);

    const dedupeKeys = findings.map(buildDedupeKey);
    const existing = dedupeKeys.length
      ? await this.prisma.reflectionCandidate.findMany({ where: { userId, dedupeKey: { in: dedupeKeys } } })
      : [];
    const existingByKey = new Map(existing.map((c) => [c.dedupeKey, c]));

    let created = 0;
    let updated = 0;

    for (let i = 0; i < findings.length; i += 1) {
      const finding = findings[i]!;
      const dedupeKey = dedupeKeys[i]!;
      const existingCandidate = existingByKey.get(dedupeKey);

      if (existingCandidate && RESOLVED_STATES.includes(existingCandidate.state)) {
        continue;
      }

      const daysSinceWindowEnd = Math.max(0, (Date.now() - finding.windowEnd.getTime()) / DAY_MS);
      const { score, factors } = this.scoreService.score({
        sourceCount: finding.sources.length,
        daysSinceWindowEnd,
        hints: finding.scoreHints,
        pinned: existingCandidate?.pinned ?? false,
      });

      await this.prisma.$transaction(async (tx) => {
        const candidate = existingCandidate
          ? await tx.reflectionCandidate.update({
              where: { id: existingCandidate.id },
              data: {
                category: finding.category,
                trigger: finding.trigger,
                state: 'READY',
                window: finding.window,
                windowStart: finding.windowStart,
                windowEnd: finding.windowEnd,
                reason: finding.reason,
                score,
                scoreFactors: factors,
                groupKey: finding.groupKey,
              },
            })
          : await tx.reflectionCandidate.create({
              data: {
                userId,
                category: finding.category,
                trigger: finding.trigger,
                state: 'READY',
                window: finding.window,
                windowStart: finding.windowStart,
                windowEnd: finding.windowEnd,
                reason: finding.reason,
                score,
                scoreFactors: factors,
                groupKey: finding.groupKey,
                dedupeKey,
              },
            });

        await tx.reflectionSourceRef.deleteMany({ where: { reflectionCandidateId: candidate.id } });
        await tx.reflectionSourceRef.createMany({
          data: finding.sources.map((s) => ({
            reflectionCandidateId: candidate.id,
            sourceType: s.sourceType,
            sourceId: s.sourceId,
            sourceTimestamp: s.sourceTimestamp,
          })),
        });
      });

      if (existingCandidate) updated += 1;
      else created += 1;
    }

    await this.expireStaleCurrencySensitiveCandidates(userId, new Set(dedupeKeys));

    this.logger.log(
      `Reflection generation: user findings=${findings.length} created=${created} updated=${updated} latencyMs=${Date.now() - startedAt}`,
    );
  }

  /** See CURRENCY_SENSITIVE_TRIGGERS above. */
  private async expireStaleCurrencySensitiveCandidates(userId: string, currentDedupeKeys: Set<string>): Promise<void> {
    const stale = await this.prisma.reflectionCandidate.findMany({
      where: { userId, trigger: { in: CURRENCY_SENSITIVE_TRIGGERS }, state: { in: ['NEW', 'READY'] } },
    });
    const staleIds = stale.filter((c) => !currentDedupeKeys.has(c.dedupeKey)).map((c) => c.id);
    if (staleIds.length === 0) return;

    await this.prisma.reflectionCandidate.updateMany({
      where: { id: { in: staleIds } },
      data: { state: 'EXPIRED', expiredAt: new Date() },
    });
  }
}
