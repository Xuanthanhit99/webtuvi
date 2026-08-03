import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { Memory, MemoryStatus, MemoryType, MemoryVisibility } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { MemoryAuditService, type MemoryAuditEntryDto } from '../audit/memory-audit.service';
import { toMemoryDto, type MemoryDto } from '../memory.mappers';

export interface ListMemoriesParams {
  type?: MemoryType;
  status?: Exclude<MemoryStatus, 'DELETED'>;
  from?: Date;
  to?: Date;
  sort?: 'newest' | 'oldest';
  page?: number;
  pageSize?: number;
}

export interface ListMemoriesResult {
  items: MemoryDto[];
  total: number;
  page: number;
  pageSize: number;
}

export interface TimelineParams {
  type?: MemoryType;
  status?: Exclude<MemoryStatus, 'DELETED'>;
  from?: Date;
  to?: Date;
  cursor?: string;
  limit?: number;
}

export interface TimelineItemDto extends MemoryDto {
  group: 'today' | 'this_week' | 'earlier';
  sourceAvailable: boolean;
  whyThisMemory: string;
  consentExplanation: string;
}

export interface TimelineResult {
  items: TimelineItemDto[];
  nextCursor: string | null;
}

export interface UpdateMemoryParams {
  title?: string;
  visibility?: MemoryVisibility;
}

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const DEFAULT_TIMELINE_LIMIT = 20;
const MAX_TIMELINE_LIMIT = 50;

/**
 * Memory CRUD, timeline, and version history. Ownership is enforced on every
 * method — a memory is only ever visible to the user who owns it. A deleted
 * memory (Sprint 3A hard-deletes on `remove()` — see deletion policy in
 * docs/security/memory-privacy.md) is structurally impossible to fetch again:
 * the row is gone, so every read naturally 404s/omits it, no separate
 * "is-deleted" filter needs to be remembered at every call site.
 *
 * `update()` deliberately only allows `title` and `visibility` — never
 * `summary`/`structuredPayload`/`type`. This reconciles the sprint brief's
 * literal PATCH endpoint with the Product Bible's explicit, repeated rule
 * that memory content is never directly user-writable, only deletable
 * (Module 10 §8, Module 20 §8, Module 21 §8, Module 3 §9's Data Ownership
 * asymmetry). See docs/architecture/memory-engine.md "Editing vs. deletion".
 */
@Injectable()
export class MemoryRecordService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: MemoryAuditService,
  ) {}

  async list(userId: string, params: ListMemoriesParams): Promise<ListMemoriesResult> {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, params.pageSize ?? DEFAULT_PAGE_SIZE));

    const where = {
      userId,
      status: params.status ?? { notIn: ['DELETED', 'ARCHIVED'] as MemoryStatus[] },
      ...(params.type ? { type: params.type } : {}),
      ...(params.from || params.to
        ? { createdAt: { ...(params.from ? { gte: params.from } : {}), ...(params.to ? { lte: params.to } : {}) } }
        : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.memory.count({ where }),
      this.prisma.memory.findMany({
        where,
        orderBy: { createdAt: params.sort === 'oldest' ? 'asc' : 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return { items: rows.map(toMemoryDto), total, page, pageSize };
  }

  /** Used only by DashboardService's Memory Highlight — the most recent genuinely-accepted memory, or null. Never a candidate/archived/deleted row. */
  async mostRecentAccepted(userId: string): Promise<MemoryDto | null> {
    const memory = await this.prisma.memory.findFirst({
      where: { userId, status: 'ACCEPTED' },
      orderBy: { createdAt: 'desc' },
    });
    return memory ? toMemoryDto(memory) : null;
  }

  async getOne(userId: string, id: string): Promise<MemoryDto> {
    const memory = await this.findOwned(userId, id);
    await this.audit.record({ userId, memoryId: id, action: 'VIEWED' });
    return toMemoryDto(memory);
  }

  async update(userId: string, id: string, params: UpdateMemoryParams, requestId?: string): Promise<MemoryDto> {
    const memory = await this.findOwned(userId, id);
    if (memory.status === 'ARCHIVED') {
      throw new ConflictException({ code: 'MEMORY_ARCHIVED', message: 'Restore this memory before editing it.' });
    }
    if (Object.keys(params).length === 0) {
      return toMemoryDto(memory);
    }

    const nextVersion = memory.version + 1;
    const nextTitle = params.title ?? memory.title;
    const nextVisibility = params.visibility ?? memory.visibility;

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.memory.update({
        where: { id },
        data: { title: nextTitle, visibility: nextVisibility, version: nextVersion },
      });
      await tx.memoryVersion.create({
        data: {
          memoryId: id,
          version: nextVersion,
          type: result.type,
          title: result.title,
          summary: result.summary,
          structuredPayload: result.structuredPayload ?? undefined,
          visibility: result.visibility,
          changeReason: 'updated',
        },
      });
      return result;
    });

    await this.audit.record({ userId, memoryId: id, action: 'UPDATED', requestId, metadata: { fields: Object.keys(params) } });
    return toMemoryDto(updated);
  }

  async archive(userId: string, id: string, requestId?: string): Promise<MemoryDto> {
    const memory = await this.findOwned(userId, id);
    if (memory.status === 'ARCHIVED') return toMemoryDto(memory);

    const updated = await this.prisma.memory.update({
      where: { id },
      data: { status: 'ARCHIVED', archivedAt: new Date() },
    });
    await this.audit.record({ userId, memoryId: id, action: 'ARCHIVED', requestId });
    return toMemoryDto(updated);
  }

  async restore(userId: string, id: string, requestId?: string): Promise<MemoryDto> {
    const memory = await this.findOwned(userId, id);
    if (memory.status !== 'ARCHIVED') {
      throw new ConflictException({ code: 'MEMORY_NOT_ARCHIVED', message: 'Only an archived memory can be restored.' });
    }

    const updated = await this.prisma.memory.update({
      where: { id },
      data: { status: 'ACCEPTED', archivedAt: null },
    });
    await this.audit.record({ userId, memoryId: id, action: 'RESTORED', requestId });
    return toMemoryDto(updated);
  }

  /**
   * Hard-deletes the row (cascading to its MemoryVersion history — content,
   * not just status, is gone). Deliberately silent/idempotent for any memory
   * that isn't found under this exact (id, userId) pair — already deleted,
   * never existed, or belongs to someone else all look identical from the
   * outside, so another user can never infer a memory's existence from a
   * delete call's response. The audit row is written *before* the delete so
   * the event itself survives even though the content it refers to doesn't.
   * See docs/security/memory-privacy.md "Deletion semantics".
   */
  async remove(userId: string, id: string, requestId?: string): Promise<void> {
    const memory = await this.prisma.memory.findFirst({ where: { id, userId } });
    if (!memory) return;

    await this.audit.record({
      userId,
      memoryId: id,
      action: 'DELETED',
      requestId,
      metadata: { type: memory.type, previousStatus: memory.status },
    });
    await this.prisma.memory.delete({ where: { id } });
  }

  async timeline(userId: string, params: TimelineParams): Promise<TimelineResult> {
    const limit = Math.min(MAX_TIMELINE_LIMIT, Math.max(1, params.limit ?? DEFAULT_TIMELINE_LIMIT));
    const cursorDate = params.cursor ? new Date(params.cursor) : undefined;

    const where = {
      userId,
      status: params.status ?? { notIn: ['DELETED', 'ARCHIVED'] as MemoryStatus[] },
      ...(params.type ? { type: params.type } : {}),
      ...(cursorDate ? { createdAt: { lt: cursorDate } } : {}),
      ...(params.from || params.to
        ? { createdAt: { ...(cursorDate ? { lt: cursorDate } : {}), ...(params.from ? { gte: params.from } : {}), ...(params.to ? { lte: params.to } : {}) } }
        : {}),
    };

    const rows = await this.prisma.memory.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
    });

    const hasMore = rows.length > limit;
    const page = rows.slice(0, limit);
    const nextCursor = hasMore ? page[page.length - 1]!.createdAt.toISOString() : null;

    return { items: page.map(toTimelineItemDto), nextCursor };
  }

  async versions(userId: string, id: string) {
    await this.findOwned(userId, id);
    const versions = await this.prisma.memoryVersion.findMany({
      where: { memoryId: id },
      orderBy: { version: 'desc' },
    });
    return versions.map((v) => ({
      version: v.version,
      title: v.title,
      summary: v.summary,
      visibility: v.visibility,
      changeReason: v.changeReason,
      createdAt: v.createdAt.toISOString(),
    }));
  }

  async auditTrail(userId: string, id: string): Promise<MemoryAuditEntryDto[]> {
    await this.findOwned(userId, id);
    return this.audit.forMemory(userId, id);
  }

  private async findOwned(userId: string, id: string): Promise<Memory> {
    const memory = await this.prisma.memory.findUnique({ where: { id } });
    if (!memory || memory.userId !== userId) {
      throw new NotFoundException({ code: 'MEMORY_NOT_FOUND', message: 'That memory was not found.' });
    }
    return memory;
  }
}

function groupFor(date: Date): 'today' | 'this_week' | 'earlier' {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (date >= startOfToday) return 'today';
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - 7);
  if (date >= startOfWeek) return 'this_week';
  return 'earlier';
}

function whyThisMemoryFor(memory: Memory): string {
  switch (memory.sourceType) {
    case 'ONBOARDING':
      return 'From your onboarding conversation.';
    case 'COMPANION':
      return 'From a conversation with your Companion.';
    case 'USER_EXPLICIT':
      return 'You asked BeaconVie to remember this.';
    case 'MIGRATED_LEGACY':
      return 'Carried over from an earlier version of BeaconVie.';
    case 'SYSTEM_TEST':
      return 'Created for testing.';
  }
}

function consentExplanationFor(memory: Memory): string {
  switch (memory.consentState) {
    case 'ALLOW_TYPE':
      return `You've allowed all ${memory.type.toLowerCase().replace('_', ' ')} memories.`;
    case 'ALLOW_SELECTED':
      return 'You allowed this specific memory.';
    case 'ASK_EVERY_TIME':
      return 'You confirmed this memory when it was created.';
    case 'DENY_TYPE':
    case 'DISABLED':
      return 'Kept from before this setting changed.';
  }
}

function toTimelineItemDto(memory: Memory): TimelineItemDto {
  return {
    ...toMemoryDto(memory),
    group: groupFor(memory.createdAt),
    sourceAvailable: Boolean(memory.sourceConversationId && memory.sourceMessageId),
    whyThisMemory: whyThisMemoryFor(memory),
    consentExplanation: consentExplanationFor(memory),
  };
}
