import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { JournalEntry } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { toJournalEntryDto, type JournalEntryDto } from '../journal.mappers';

export interface JournalMarkdownExport {
  filename: string;
  content: string;
}

export interface JournalAccountExportResult {
  exportedAt: string;
  entries: JournalEntryDto[];
}

export interface JournalAccountExportJobDto {
  jobId: string;
  status: 'completed';
  result: JournalAccountExportResult;
}

const EXPORT_CACHE_TTL_MS = 15 * 60 * 1000;
const EXPORT_CACHE_PREFIX = 'journal:export';
const EXPORT_LOCK_PREFIX = 'journal:export:lock';
const EXPORT_LOCK_TTL_MS = 30_000;

/** Export only ever includes the caller's own entries — every method here is owner-scoped, the
 * same discipline as MemoryExportService. Markdown is a direct single-entry download (no
 * job-id indirection needed for one file); the account-wide export mirrors Memory's exact
 * synchronous-plus-Redis-cached-by-jobId shape for consistency across the product. PDF is
 * explicitly out of scope this sprint — no PDF library exists anywhere in this repository (see
 * docs/architecture/journal-foundation.md "Export"). */
@Injectable()
export class JournalExportService {
  private readonly logger = new Logger('JournalExport');

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async exportEntryAsMarkdown(userId: string, id: string): Promise<JournalMarkdownExport> {
    const entry = await this.findOwned(userId, id);
    const frontMatter = [
      '---',
      `title: ${escapeYaml(entry.title)}`,
      `date: ${entry.createdAt.toISOString()}`,
      entry.mood ? `mood: ${entry.mood}` : null,
      entry.tags.length > 0 ? `tags: [${entry.tags.map((t) => escapeYaml(t)).join(', ')}]` : null,
      '---',
    ]
      .filter((line): line is string => line !== null)
      .join('\n');

    const content = `${frontMatter}\n\n${entry.content}\n`;
    this.logger.log(`Journal exported id=${id} format=markdown`);
    return { filename: `${slugify(entry.title)}.md`, content };
  }

  async exportEntryAsJson(userId: string, id: string): Promise<JournalEntryDto> {
    const entry = await this.findOwned(userId, id);
    this.logger.log(`Journal exported id=${id} format=json`);
    return toJournalEntryDto(entry);
  }

  /** Mirrors MemoryExportService.createExport() exactly — a per-user Redis `SET NX` lock caps
   * this to one in-flight export at a time (a second concurrent call gets `409`, not a race),
   * fails open on a Redis error. */
  async createAccountExport(userId: string): Promise<JournalAccountExportJobDto> {
    const acquired = await this.acquireLock(userId);
    if (!acquired) {
      throw new ConflictException({
        code: 'JOURNAL_EXPORT_ALREADY_IN_PROGRESS',
        message: 'An export is already being prepared. Please wait for it to finish before starting another.',
      });
    }

    try {
      const entries = await this.prisma.journalEntry.findMany({
        where: { userId, state: { not: 'DELETED' } },
        orderBy: { createdAt: 'asc' },
      });

      const result: JournalAccountExportResult = {
        exportedAt: new Date().toISOString(),
        entries: entries.map(toJournalEntryDto),
      };

      const jobId = randomUUID();
      await this.cache(userId, jobId, result);
      this.logger.log(`Journal account export created entryCount=${entries.length}`);

      return { jobId, status: 'completed', result };
    } finally {
      await this.releaseLock(userId);
    }
  }

  async getAccountExport(userId: string, jobId: string): Promise<JournalAccountExportJobDto> {
    const cached = await this.readCache(userId, jobId);
    if (!cached) {
      throw new NotFoundException({
        code: 'JOURNAL_EXPORT_NOT_FOUND',
        message: 'That export is not available — it may have expired (exports are kept for 15 minutes). Request a new export.',
      });
    }
    return { jobId, status: 'completed', result: cached };
  }

  private async findOwned(userId: string, id: string): Promise<JournalEntry> {
    const entry = await this.prisma.journalEntry.findUnique({ where: { id } });
    if (!entry || entry.userId !== userId) {
      throw new NotFoundException({ code: 'JOURNAL_NOT_FOUND', message: 'That journal entry was not found.' });
    }
    return entry;
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
      return true;
    }
  }

  private async releaseLock(userId: string): Promise<void> {
    try {
      await this.redis.client.del(this.lockKey(userId));
    } catch {
      // Best-effort — the TTL above self-heals a missed release.
    }
  }

  private async cache(userId: string, jobId: string, result: JournalAccountExportResult): Promise<void> {
    try {
      await this.redis.client.set(this.key(userId, jobId), JSON.stringify(result), 'PX', EXPORT_CACHE_TTL_MS);
    } catch {
      // Fail open — the export was already returned synchronously to the caller.
    }
  }

  private async readCache(userId: string, jobId: string): Promise<JournalAccountExportResult | null> {
    try {
      const raw = await this.redis.client.get(this.key(userId, jobId));
      return raw ? (JSON.parse(raw) as JournalAccountExportResult) : null;
    } catch {
      return null;
    }
  }
}

function escapeYaml(value: string): string {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function slugify(title: string): string {
  const slug = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug.length > 0 ? slug.slice(0, 80) : 'journal-entry';
}
