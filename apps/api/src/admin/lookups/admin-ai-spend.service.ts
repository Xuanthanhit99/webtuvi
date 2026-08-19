import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { AdminAiSpendQueryDto } from '../dto/admin-ai-spend-query.dto';
import type { AdminAiSpendDto } from '../admin.types';

/**
 * Interim Sprint — Admin Operator Tooling. Aggregates only `ai_usages`/`provider_logs` — neither
 * table has a prompt/completion/content field, so an AI-conversation viewer is structurally
 * impossible to build from this service, not merely avoided by convention.
 *
 * `provider_logs` has no `userId` column (feature/provider-level, not user-attributed, by design —
 * see its own Prisma schema comment). Consequently a per-user failure rate cannot be computed from
 * it, and this service must not fake one via a `sourceId` join — see
 * docs/audit/admin-operator-tooling-pre-implementation-audit.md §9. When `query.userId` is set,
 * `failureCount` is `null`, not an incorrect number.
 */
@Injectable()
export class AdminAiSpendService {
  constructor(private readonly prisma: PrismaService) {}

  async getSpend(query: AdminAiSpendQueryDto): Promise<AdminAiSpendDto> {
    const since = this.windowStart(query.window);

    const usageWhere: Prisma.AIUsageWhereInput = {
      createdAt: { gte: since },
      ...(query.feature ? { feature: query.feature } : {}),
      ...(query.provider ? { provider: query.provider } : {}),
      ...(query.userId ? { userId: query.userId } : {}),
    };
    const usageAgg = await this.prisma.aIUsage.aggregate({
      where: usageWhere,
      _sum: { estimatedCostUsd: true },
      _count: { _all: true },
    });

    let failureCount: number | null = null;
    if (!query.userId) {
      const logWhere: Prisma.ProviderLogWhereInput = {
        createdAt: { gte: since },
        success: false,
        ...(query.feature ? { feature: query.feature } : {}),
        ...(query.provider ? { provider: query.provider } : {}),
      };
      failureCount = await this.prisma.providerLog.count({ where: logWhere });
    }

    return {
      window: query.window,
      filters: { feature: query.feature ?? null, provider: query.provider ?? null, userId: query.userId ?? null },
      estimatedCostUsd: usageAgg._sum.estimatedCostUsd ? usageAgg._sum.estimatedCostUsd.toNumber() : 0,
      requestCount: usageAgg._count._all,
      failureCount,
    };
  }

  private windowStart(window: AdminAiSpendQueryDto['window']): Date {
    const now = new Date();
    if (window === 'today') {
      return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    }
    return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
}
