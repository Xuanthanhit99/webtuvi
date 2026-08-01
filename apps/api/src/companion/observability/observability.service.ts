import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { AIProviderName } from '../providers/provider.types';

export interface ProviderCallLog {
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
      `provider=${entry.provider} model=${entry.model} latencyMs=${entry.latencyMs} ` +
        `success=${entry.success} retryCount=${entry.retryCount}` +
        (entry.errorCode ? ` errorCode=${entry.errorCode}` : '') +
        (entry.streamDurationMs !== undefined ? ` streamDurationMs=${entry.streamDurationMs}` : ''),
    );

    try {
      await this.prisma.providerLog.create({
        data: {
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

  logUsage(params: { userId: string; conversationId: string; provider: AIProviderName; model: string; promptTokens: number; completionTokens: number; estimatedCostUsd: number }): void {
    this.logger.log(
      `usage provider=${params.provider} model=${params.model} promptTokens=${params.promptTokens} ` +
        `completionTokens=${params.completionTokens} estimatedCostUsd=${params.estimatedCostUsd.toFixed(6)}`,
    );
  }
}

function toPrismaProviderName(name: AIProviderName): 'OPENAI' | 'ANTHROPIC' | 'GEMINI' | 'MOCK' {
  return name.toUpperCase() as 'OPENAI' | 'ANTHROPIC' | 'GEMINI' | 'MOCK';
}

export { toPrismaProviderName };
