import { BadRequestException, ConflictException, ForbiddenException, Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { EntitlementService } from '../../payment/entitlement/entitlement.service';
import { CostControlService } from '../../companion/cost/cost-control.service';
import { GenerationLockService } from '../../companion/concurrency/generation-lock.service';
import { ProviderOrchestratorService } from '../../companion/providers/provider-orchestrator.service';
import { SafetyService } from '../../companion/safety/safety.service';
import { ObservabilityService } from '../../companion/observability/observability.service';
import { AnalyticsService } from '../../analytics/analytics.service';
import type { AIProviderName, ChatMessage, TokenUsage } from '../../companion/providers/provider.types';
import { ReportReadinessService } from '../readiness/report-readiness.service';
import { ReportSnapshotService } from '../snapshot/report-snapshot.service';
import { buildReportUserMessage, findGroundingViolations, REPORT_SYSTEM_PROMPT } from './report-prompt';
import { AI_PROMPT_VERSION, REPORT_SCHEMA_VERSION, REPORT_TEMPLATE_VERSION, ReportStructuredResultSchema, type ReportSourceSnapshot, type ReportStructuredResult } from '../reports.types';
import { toReportDto, type ReportDto } from '../reports.mappers';

const MAX_TOKENS = 2200;
/** Bounded retry specifically for schema-validation failures — distinct from the provider-level
 * retry/fallback chain `ProviderOrchestratorService` already owns. One retry only: a model that
 * fails structured output twice in a row is treated as a real failure (`VALIDATION_FAILED`), never
 * loosened into accepting free-form/partial output (locked stop condition C). */
const MAX_SCHEMA_VALIDATION_ATTEMPTS = 2;

export class ReportGenerationInProgressError extends ConflictException {
  constructor() {
    super({ code: 'REPORT_GENERATION_IN_PROGRESS', message: 'A report is already being generated. Please wait for it to finish.' });
  }
}

export class ReportSourcesNotReadyError extends BadRequestException {
  constructor() {
    super({
      code: 'REPORT_SOURCES_NOT_READY',
      message: 'A Personal Destiny Report needs both a completed Natal Chart and a Numerology reading first.',
    });
  }
}

/**
 * Sprint 16 — Personal Destiny Report generation. Synchronous, locked decision #8
 * (docs/product/personal-destiny-report-decisions.md): one HTTP request runs the full
 * readiness -> premium -> budget -> lock -> snapshot -> AI synthesis -> grounding-verification ->
 * persist pipeline, reusing Companion's existing provider orchestrator/safety/cost-control
 * verbatim — no new AI infrastructure, no queue.
 */
@Injectable()
export class ReportGenerationService {
  private readonly logger = new Logger('ReportGeneration');

  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlementService: EntitlementService,
    private readonly readiness: ReportReadinessService,
    private readonly snapshotService: ReportSnapshotService,
    private readonly costControl: CostControlService,
    private readonly generationLock: GenerationLockService,
    private readonly orchestrator: ProviderOrchestratorService,
    private readonly safety: SafetyService,
    private readonly observability: ObservabilityService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  async generate(userId: string): Promise<ReportDto> {
    await this.entitlementService.requirePremium(userId);

    const readiness = await this.readiness.check(userId);
    if (!readiness.ready) throw new ReportSourcesNotReadyError();

    const budget = await this.costControl.checkBudget(userId);
    if (!budget.allowed) {
      throw new ForbiddenException({ code: 'AI_BUDGET_EXCEEDED', message: budget.message });
    }

    const acquired = await this.generationLock.tryAcquireDiscovery('reports', userId, 'generate');
    if (!acquired) throw new ReportGenerationInProgressError();

    let reportId: string | null = null;
    try {
      const snapshot = await this.snapshotService.build(userId, readiness.natalChart.sourceId!, readiness.numerology.sourceId!);

      const report = await this.prisma.destinyReport.create({
        data: {
          userId,
          status: 'GENERATING',
          natalChartId: readiness.natalChart.sourceId!,
          numerologyReadingId: readiness.numerology.sourceId!,
          reportSchemaVersion: REPORT_SCHEMA_VERSION,
          reportTemplateVersion: REPORT_TEMPLATE_VERSION,
          aiPromptVersion: AI_PROMPT_VERSION,
          sourceSnapshot: snapshot as unknown as Prisma.InputJsonValue,
        },
      });
      reportId = report.id;

      const outcome = await this.runSynthesis(userId, reportId, snapshot);

      if (outcome.kind === 'success') {
        const updated = await this.prisma.destinyReport.update({
          where: { id: reportId },
          data: {
            status: 'READY',
            structuredResult: outcome.result as unknown as Prisma.InputJsonValue,
            aiProvider: outcome.provider.toUpperCase() as never,
            aiModel: outcome.model,
            completedAt: new Date(),
          },
        });
        void this.analyticsService.trackServerEvent({ event: 'report_generation_completed', userId, properties: { feature: 'reports' } });
        return toReportDto(updated);
      }

      const failed = await this.prisma.destinyReport.update({
        where: { id: reportId },
        data: { status: 'FAILED', failureReason: outcome.reason, completedAt: new Date() },
      });
      void this.analyticsService.trackServerEvent({ event: 'report_generation_failed', userId, properties: { feature: 'reports' } });
      return toReportDto(failed);
    } finally {
      await this.generationLock.releaseDiscovery('reports', userId, 'generate');
    }
  }

  private async runSynthesis(
    userId: string,
    reportId: string,
    snapshot: ReportSourceSnapshot,
  ): Promise<
    | { kind: 'success'; result: ReportStructuredResult; provider: AIProviderName; model: string }
    | { kind: 'failure'; reason: 'PROVIDER_UNAVAILABLE' | 'VALIDATION_FAILED' | 'SAFETY_REFUSED' | 'INTERNAL_ERROR' }
  > {
    // Memory/Tarot content is user-authored free text flowing into the prompt — screened exactly
    // like Numerology/Tarot already screen their own free-text fields before embedding them.
    const freeTextToScreen = [
      ...(snapshot.memory ?? []).map((m) => `${m.title} ${m.summary}`),
      ...(snapshot.tarot ?? []).flatMap((t) => t.cards.map((c) => c.positionLabel ?? '')),
    ].join(' ');
    if (freeTextToScreen.trim()) {
      const inputCheck = this.safety.checkInput(freeTextToScreen);
      if (!inputCheck.allowed) {
        this.logger.warn(`Report generation input refused for report=${reportId}: category=${inputCheck.category}`);
        return { kind: 'failure', reason: 'SAFETY_REFUSED' };
      }
    }

    const messages: ChatMessage[] = [
      { role: 'system', content: REPORT_SYSTEM_PROMPT },
      { role: 'user', content: buildReportUserMessage(snapshot) },
    ];

    for (let attempt = 1; attempt <= MAX_SCHEMA_VALIDATION_ATTEMPTS; attempt++) {
      let content = '';
      let usage: TokenUsage | null = null;
      let model = '';
      let provider: AIProviderName | null = null;

      try {
        for await (const chunk of this.orchestrator.stream(messages, { maxTokens: MAX_TOKENS, temperature: 0.6 }, { feature: 'reports', sourceId: reportId })) {
          if (chunk.type === 'token') content += chunk.content;
          if (chunk.type === 'done') {
            usage = chunk.usage;
            model = chunk.model;
            provider = chunk.provider;
          }
          if (chunk.type === 'error') {
            this.logger.warn(`Report generation provider error for report=${reportId}: code=${chunk.code ?? 'unknown'}`);
            return { kind: 'failure', reason: 'PROVIDER_UNAVAILABLE' };
          }
        }
      } catch (error) {
        this.logger.warn(`Report generation failed for report=${reportId}: ${error instanceof Error ? error.message : 'unknown error'}`);
        return { kind: 'failure', reason: 'PROVIDER_UNAVAILABLE' };
      }

      if (usage && provider) {
        const estimatedCostUsd = await this.costControl.record({
          userId,
          feature: 'reports',
          sourceId: reportId,
          provider,
          model,
          promptTokens: usage.promptTokens,
          completionTokens: usage.completionTokens,
        });
        this.observability.logUsage({ userId, feature: 'reports', sourceId: reportId, provider, model, promptTokens: usage.promptTokens, completionTokens: usage.completionTokens, estimatedCostUsd });
      }

      if (!content.trim()) {
        this.logger.warn(`Report generation returned empty content for report=${reportId}, attempt=${attempt}`);
        continue;
      }

      const outputCheck = this.safety.checkOutput(content);
      if (!outputCheck.allowed) {
        this.logger.warn(`Report generation output refused for report=${reportId}: category=${outputCheck.category}`);
        return { kind: 'failure', reason: 'SAFETY_REFUSED' };
      }

      const parsed = this.parseAndValidate(content, snapshot);
      if (parsed) {
        return { kind: 'success', result: parsed, provider: provider!, model };
      }

      this.logger.warn(`Report structured output failed validation for report=${reportId}, attempt=${attempt}`);
    }

    return { kind: 'failure', reason: 'VALIDATION_FAILED' };
  }

  /** Never persists malformed output as READY (locked decision #14) — parses, validates against
   * the locked zod schema, then runs the automated grounding-verification pass
   * (`findGroundingViolations`) that rejects any evidence reference not actually present in the
   * snapshot. Returns null on any failure so the caller can retry or fail cleanly. */
  private parseAndValidate(content: string, snapshot: ReportSourceSnapshot): ReportStructuredResult | null {
    let json: unknown;
    try {
      const trimmed = content.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
      json = JSON.parse(trimmed);
    } catch {
      return null;
    }

    const validation = ReportStructuredResultSchema.safeParse(json);
    if (!validation.success) return null;

    const violations = findGroundingViolations(validation.data, snapshot);
    if (violations.length > 0) {
      this.logger.warn(`Report grounding violations: ${violations.join('; ')}`);
      return null;
    }

    return validation.data;
  }
}
