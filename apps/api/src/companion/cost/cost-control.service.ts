import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { AIProviderName } from '../providers/provider.types';
import { estimateCostUsd } from '../providers/pricing';
import { toPrismaProviderName } from '../observability/observability.service';

export interface UsageSummary {
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
}

/**
 * Tracks and estimates cost — recording only, no billing integration and no
 * hard spend cap (not requested for this sprint; see docs/architecture/companion-core.md
 * "Cost control"). `record()` is called once per completed (or cancelled)
 * generation by StreamService.
 */
@Injectable()
export class CostControlService {
  constructor(private readonly prisma: PrismaService) {}

  async record(params: {
    userId: string;
    conversationId: string;
    provider: AIProviderName;
    model: string;
    promptTokens: number;
    completionTokens: number;
  }): Promise<number> {
    const estimatedCostUsd = estimateCostUsd(
      params.provider,
      params.model,
      params.promptTokens,
      params.completionTokens,
    );

    await this.prisma.aIUsage.create({
      data: {
        userId: params.userId,
        conversationId: params.conversationId,
        provider: toPrismaProviderName(params.provider),
        model: params.model,
        promptTokens: params.promptTokens,
        completionTokens: params.completionTokens,
        totalTokens: params.promptTokens + params.completionTokens,
        estimatedCostUsd,
      },
    });

    return estimatedCostUsd;
  }

  async usageForUser(userId: string, since: Date): Promise<UsageSummary> {
    return this.summarize({ userId, createdAt: { gte: since } });
  }

  async dailyUsageForUser(userId: string): Promise<UsageSummary> {
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    return this.usageForUser(userId, since);
  }

  async monthlyUsageForUser(userId: string): Promise<UsageSummary> {
    const since = new Date();
    since.setDate(1);
    since.setHours(0, 0, 0, 0);
    return this.usageForUser(userId, since);
  }

  private async summarize(where: Record<string, unknown>): Promise<UsageSummary> {
    const result = await this.prisma.aIUsage.aggregate({
      where,
      _sum: { promptTokens: true, completionTokens: true, totalTokens: true, estimatedCostUsd: true },
    });

    return {
      totalPromptTokens: result._sum.promptTokens ?? 0,
      totalCompletionTokens: result._sum.completionTokens ?? 0,
      totalTokens: result._sum.totalTokens ?? 0,
      estimatedCostUsd: Number(result._sum.estimatedCostUsd ?? 0),
    };
  }
}
