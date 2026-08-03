import { Injectable, Logger } from '@nestjs/common';
import type { MemoryAuditAction, MemoryActorType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface MemoryAuditEntryDto {
  id: string;
  memoryId: string | null;
  action: string;
  actorType: string;
  createdAt: string;
}

/**
 * Writes and reads `MemoryAudit` rows — event trail only, never memory
 * content. `metadata` must only ever carry safe, structural facts (e.g.
 * `{ type, previousStatus }`) — never `title`/`summary`/`structuredPayload`
 * or any other content field. See docs/security/memory-privacy.md
 * "Audit/logging policy".
 *
 * A failure to write an audit row is caught and logged but never allowed to
 * break the calling operation — audit is best-effort observability, not a
 * transactional guarantee, mirroring Companion Core's ObservabilityService.
 */
@Injectable()
export class MemoryAuditService {
  private readonly logger = new Logger('MemoryAudit');

  constructor(private readonly prisma: PrismaService) {}

  async record(params: {
    userId: string;
    memoryId?: string | null;
    action: MemoryAuditAction;
    actorType?: MemoryActorType;
    requestId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    try {
      await this.prisma.memoryAudit.create({
        data: {
          userId: params.userId,
          memoryId: params.memoryId ?? null,
          action: params.action,
          actorType: params.actorType ?? 'USER',
          requestId: params.requestId,
          metadata: params.metadata as Prisma.InputJsonValue | undefined,
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to persist MemoryAudit(action=${params.action})`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  /** Owner-scoped — callers must already have verified `memoryId` belongs to `userId`. */
  async forMemory(userId: string, memoryId: string): Promise<MemoryAuditEntryDto[]> {
    const rows = await this.prisma.memoryAudit.findMany({
      where: { userId, memoryId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toDto);
  }

  async recentForUser(userId: string, take = 50): Promise<MemoryAuditEntryDto[]> {
    const rows = await this.prisma.memoryAudit.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take,
    });
    return rows.map(toDto);
  }
}

function toDto(row: { id: string; memoryId: string | null; action: string; actorType: string; createdAt: Date }): MemoryAuditEntryDto {
  return {
    id: row.id,
    memoryId: row.memoryId,
    action: row.action,
    actorType: row.actorType,
    createdAt: row.createdAt.toISOString(),
  };
}
