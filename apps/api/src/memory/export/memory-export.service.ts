import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { MemoryAuditService } from '../audit/memory-audit.service';
import { MemoryConsentService } from '../consent/memory-consent.service';
import { toMemoryDto, type MemoryDto } from '../memory.mappers';

export interface MemoryExportResult {
  exportedAt: string;
  memories: MemoryDto[];
  versions: { memoryId: string; version: number; title: string; summary: string; visibility: string; changeReason: string; createdAt: string }[];
  consent: Awaited<ReturnType<MemoryConsentService['getSummary']>>;
  activityHistory: { memoryId: string | null; action: string; createdAt: string }[];
}

export interface MemoryExportJobDto {
  jobId: string;
  status: 'completed';
  result: MemoryExportResult;
}

const EXPORT_CACHE_TTL_MS = 15 * 60 * 1000;
const EXPORT_CACHE_PREFIX = 'memory:export';
const EXPORT_LOCK_PREFIX = 'memory:export:lock';
// Generous relative to how long createExport() actually takes (a handful of
// Prisma queries) — purely a safety net against a genuinely stuck/hung
// request, not a normal-case wait time.
const EXPORT_LOCK_TTL_MS = 30_000;

/**
 * A basic, user-owned export. Runs synchronously — Sprint 3A's expected data
 * volumes make a background job queue unnecessary infrastructure (no BullMQ
 * is introduced anywhere in this sprint). `GET /memory/export/:jobId` is
 * still meaningfully backed: the completed result is cached in Redis for a
 * short, disclosed window (15 minutes) so the two-step API shape the sprint
 * brief asks for actually works, rather than a job store that's faked to
 * "always succeed instantly." After the TTL, the job id simply expires —
 * documented, not silently pretended to be permanent storage.
 *
 * Excludes: internal ProviderLog rows, any secrets, other users' data, raw
 * system prompts, and internal safety metadata not meant for the user. Only
 * this user's own Memory/MemoryVersion/consent/MemoryAudit data is included.
 */
@Injectable()
export class MemoryExportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly consent: MemoryConsentService,
    private readonly audit: MemoryAuditService,
  ) {}

  /**
   * A per-user Redis lock (`SET NX`) caps this to one in-flight export at a
   * time — small, targeted fix for "no unbounded concurrent export creation
   * per user" (Sprint 3A release closure), not a queue: a second concurrent
   * call while one is running gets a clear `409` rather than both racing to
   * compute and cache their own (harmless but wasteful) copies. Fails open on
   * a Redis error, consistent with every other Redis-backed guard in this
   * codebase (Companion's rate limiter/concurrency lock) — an outage degrades
   * this protection rather than blocking exports entirely.
   */
  async createExport(userId: string, requestId?: string): Promise<MemoryExportJobDto> {
    const acquired = await this.acquireLock(userId);
    if (!acquired) {
      throw new ConflictException({
        code: 'EXPORT_ALREADY_IN_PROGRESS',
        message: 'An export is already being prepared. Please wait for it to finish before starting another.',
      });
    }

    try {
      const [memories, consentSummary, auditEntries] = await Promise.all([
        this.prisma.memory.findMany({ where: { userId, status: { not: 'DELETED' } }, orderBy: { createdAt: 'asc' } }),
        this.consent.getSummary(userId),
        this.audit.recentForUser(userId, 500),
      ]);

      const versions = await this.prisma.memoryVersion.findMany({
        where: { memory: { userId } },
        orderBy: { createdAt: 'asc' },
      });

      const result: MemoryExportResult = {
        exportedAt: new Date().toISOString(),
        memories: memories.map(toMemoryDto),
        versions: versions.map((v) => ({
          memoryId: v.memoryId,
          version: v.version,
          title: v.title,
          summary: v.summary,
          visibility: v.visibility,
          changeReason: v.changeReason,
          createdAt: v.createdAt.toISOString(),
        })),
        consent: consentSummary,
        activityHistory: auditEntries.map((a) => ({ memoryId: a.memoryId, action: a.action, createdAt: a.createdAt })),
      };

      const jobId = randomUUID();
      await this.cache(userId, jobId, result);
      await this.audit.record({ userId, action: 'EXPORTED', requestId, metadata: { memoryCount: memories.length } });

      return { jobId, status: 'completed', result };
    } finally {
      await this.releaseLock(userId);
    }
  }

  async getExport(userId: string, jobId: string): Promise<MemoryExportJobDto> {
    const cached = await this.readCache(userId, jobId);
    if (!cached) {
      throw new NotFoundException({
        code: 'MEMORY_EXPORT_NOT_FOUND',
        message: 'That export is not available — it may have expired (exports are kept for 15 minutes). Request a new export.',
      });
    }
    return { jobId, status: 'completed', result: cached };
  }

  private key(userId: string, jobId: string): string {
    return `${EXPORT_CACHE_PREFIX}:${userId}:${jobId}`;
  }

  private lockKey(userId: string): string {
    return `${EXPORT_LOCK_PREFIX}:${userId}`;
  }

  private async acquireLock(userId: string): Promise<boolean> {
    try {
      const result = await this.redis.client.set(this.lockKey(userId), '1', 'PX', EXPORT_LOCK_TTL_MS, 'NX');
      return result === 'OK';
    } catch {
      return true; // fail open
    }
  }

  private async releaseLock(userId: string): Promise<void> {
    try {
      await this.redis.client.del(this.lockKey(userId));
    } catch {
      // Best-effort — the TTL above self-heals a missed release.
    }
  }

  private async cache(userId: string, jobId: string, result: MemoryExportResult): Promise<void> {
    try {
      await this.redis.client.set(this.key(userId, jobId), JSON.stringify(result), 'PX', EXPORT_CACHE_TTL_MS);
    } catch {
      // Fail open: the export was already computed and returned to the caller
      // synchronously — a Redis outage only affects the later GET-by-jobId
      // convenience path, never the export itself.
    }
  }

  private async readCache(userId: string, jobId: string): Promise<MemoryExportResult | null> {
    try {
      const raw = await this.redis.client.get(this.key(userId, jobId));
      return raw ? (JSON.parse(raw) as MemoryExportResult) : null;
    } catch {
      return null;
    }
  }
}
