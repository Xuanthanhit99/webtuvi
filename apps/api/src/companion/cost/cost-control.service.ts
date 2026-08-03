import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppConfiguration } from '../../config/configuration';
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

export type BudgetCheckResult =
  | { allowed: true }
  | { allowed: false; reason: 'daily_request_limit' | 'daily_token_limit' | 'monthly_token_limit'; message: string };

function startOfDay(): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function startOfMonth(): Date {
  const date = new Date();
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * Tracks, estimates, and (since the Sprint 2B audit) enforces a coarse usage
 * budget — recording is exact (billable/final `AIUsage` rows, one per
 * completed generation, written once by `StreamService`), the budget check is
 * a courser abuse/cost ceiling independent of the short-window rate limit
 * enforced separately by `CompanionThrottlerGuard`. No billing integration —
 * `estimatedCostUsd` is an estimate, not an invoice line item.
 */
@Injectable()
export class CostControlService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Checked once, before a generation is allowed to start
   * (`ConversationService.sendMessage`) — never after the fact. Reads only
   * already-persisted `AIUsage` rows (billable/final usage), so a burst of
   * retries or failed provider attempts within a single generation — which
   * never reach `record()` — can't push a user over budget on their own.
   */
  async checkBudget(userId: string): Promise<BudgetCheckResult> {
    const budget = this.configService.get<AppConfiguration>('app')!.ai.budget;

    const [dailyRequestCount, daily, monthly] = await Promise.all([
      this.prisma.aIUsage.count({ where: { userId, createdAt: { gte: startOfDay() } } }),
      this.dailyUsageForUser(userId),
      this.monthlyUsageForUser(userId),
    ]);

    if (dailyRequestCount >= budget.dailyRequestLimit) {
      return {
        allowed: false,
        reason: 'daily_request_limit',
        message: "You've reached today's limit for Companion replies. Please try again tomorrow.",
      };
    }
    if (daily.totalTokens >= budget.dailyTokenLimit) {
      return {
        allowed: false,
        reason: 'daily_token_limit',
        message: "You've reached today's usage limit with your Companion. Please try again tomorrow.",
      };
    }
    if (monthly.totalTokens >= budget.monthlyTokenLimit) {
      return {
        allowed: false,
        reason: 'monthly_token_limit',
        message: "You've reached this month's usage limit with your Companion. Please try again next month.",
      };
    }

    return { allowed: true };
  }

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
    return this.usageForUser(userId, startOfDay());
  }

  async monthlyUsageForUser(userId: string): Promise<UsageSummary> {
    return this.usageForUser(userId, startOfMonth());
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
