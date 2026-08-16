import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { AIProviderName } from '../providers/provider.types';
import { toPrismaAIFeature, type AIFeature } from '../providers/ai-feature.types';

export interface ProviderCallLog {
  /** Sprint 12 — which product surface produced this attempt (Companion or a Discovery
   * surface). Required so every ProviderLog row is attributable — see
   * docs/architecture/discovery-ai-cost-control.md. */
  feature: AIFeature;
  /** Discovery reading id (Tarot/Numerology/NatalChart) — omitted for Companion. Unenforced,
   * mirrors this schema's existing sourceType/sourceId precedent. */
  sourceId?: string;
  provider: AIProviderName;
  model: string;
  latencyMs: number;
  success: boolean;
  errorCode?: string;
  retryCount: number;
  streamDurationMs?: number;
}

/**
 * AI observability: structured logs + a persisted `ProviderLog` row per
 * generation attempt. Deliberately never logs or persists conversation
 * content, PII, passwords, or emails — only operational metadata (provider,
 * latency, token counts, cost, model, stream duration, errors, retry count).
 * See docs/security/ai-safety.md "Observability".
 */
@Injectable()
export class ObservabilityService {
  private readonly logger = new Logger('AIObservability');

  constructor(private readonly prisma: PrismaService) {}

  async logProviderCall(entry: ProviderCallLog): Promise<void> {
    const level = entry.success ? 'log' : 'warn';
    this.logger[level](
      `feature=${entry.feature} provider=${entry.provider} model=${entry.model} latencyMs=${entry.latencyMs} ` +
        `success=${entry.success} retryCount=${entry.retryCount}` +
        (entry.errorCode ? ` errorCode=${entry.errorCode}` : '') +
        (entry.streamDurationMs !== undefined ? ` streamDurationMs=${entry.streamDurationMs}` : ''),
    );

    try {
      await this.prisma.providerLog.create({
        data: {
          feature: toPrismaAIFeature(entry.feature),
          sourceId: entry.sourceId,
          provider: toPrismaProviderName(entry.provider),
          model: entry.model,
          latencyMs: entry.latencyMs,
          success: entry.success,
          errorCode: entry.errorCode,
          retryCount: entry.retryCount,
          streamDurationMs: entry.streamDurationMs,
        },
      });
    } catch (error) {
      // Observability must never break the actual conversation flow.
      this.logger.error('Failed to persist ProviderLog', error instanceof Error ? error.stack : undefined);
    }
  }

  logUsage(params: {
    userId: string;
    feature: AIFeature;
    conversationId?: string;
    sourceId?: string;
    provider: AIProviderName;
    model: string;
    promptTokens: number;
    completionTokens: number;
    estimatedCostUsd: number;
  }): void {
    this.logger.log(
      `feature=${params.feature} provider=${params.provider} model=${params.model} promptTokens=${params.promptTokens} ` +
        `completionTokens=${params.completionTokens} estimatedCostUsd=${params.estimatedCostUsd.toFixed(6)}`,
    );
  }
}

function toPrismaProviderName(name: AIProviderName): 'OPENAI' | 'ANTHROPIC' | 'GEMINI' | 'MOCK' {
  return name.toUpperCase() as 'OPENAI' | 'ANTHROPIC' | 'GEMINI' | 'MOCK';
}

export { toPrismaProviderName };
