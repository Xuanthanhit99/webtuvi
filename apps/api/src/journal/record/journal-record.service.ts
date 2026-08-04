import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { JournalEntry, JournalMood, JournalSourceType, JournalState, JournalVisibility } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { countWords, toJournalEntryDto, type JournalEntryDto } from '../journal.mappers';

export interface CreateJournalParams {
  /** Optional — a brand-new entry may start with no title at all (see `/journal/new`, which
   * creates a real DRAFT row immediately so autosave/recovery work from the first keystroke). */
  title?: string;
  content?: string;
  mood?: JournalMood;
  tags?: string[];
}

/** Only ever populated by `CompanionJournalService`, which has independently verified
 * conversation/message ownership before calling — never derived from a public request body. */
export interface JournalSourceParams {
  sourceType: JournalSourceType;
  sourceConversationId: string;
  sourceMessageId: string;
}

export interface UpdateJournalParams {
  title?: string;
  content?: string;
  mood?: JournalMood | null;
  tags?: string[];
  visibility?: JournalVisibility;
  pinned?: boolean;
}

export interface ListJournalParams {
  q?: string;
  state?: JournalState;
  mood?: JournalMood;
  tag?: string;
  from?: Date;
  to?: Date;
  sort?: 'newest' | 'oldest' | 'recently_edited';
  pinned?: boolean;
  page?: number;
  pageSize?: number;
}

export interface ListJournalResult {
  items: JournalEntryDto[];
  total: number;
  page: number;
  pageSize: number;
}

export interface JournalRevisionDto {
  version: number;
  title: string;
  content: string;
  mood: JournalMood | null;
  tags: string[];
  changeReason: string;
  createdAt: string;
}

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

/** Every read/mutate method here is owner-scoped — see docs/security/journal-privacy.md
 * "Ownership." A soft-deleted entry (`state: 'DELETED'`) is deliberately still fetchable by its
 * owner via `getOne()` — that's what lets the "Recently deleted" recovery view and `restore()`
 * work at all — but is excluded from `list()`/`timeline()`'s default results (see
 * docs/architecture/journal-foundation.md "Lifecycle"). */
@Injectable()
export class JournalRecordService {
  private readonly logger = new Logger('Journal');

  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, params: CreateJournalParams, source?: JournalSourceParams): Promise<JournalEntryDto> {
    const title = params.title ?? '';
    const content = params.content ?? '';
    const wordCount = countWords(content);

    const entry = await this.prisma.$transaction(async (tx) => {
      const created = await tx.journalEntry.create({
        data: {
          userId,
          title,
          content,
          mood: params.mood,
          tags: params.tags ?? [],
          wordCount,
          state: 'DRAFT',
          sourceType: source?.sourceType ?? 'USER',
          sourceConversationId: source?.sourceConversationId ?? null,
          sourceMessageId: source?.sourceMessageId ?? null,
        },
      });
      await tx.journalRevision.create({
        data: {
          journalId: created.id,
          version: 1,
          title: created.title,
          content: created.content,
          mood: created.mood,
          tags: created.tags,
          changeReason: 'created',
        },
      });
      return created;
    });

    this.logger.log(`Journal created id=${entry.id} sourceType=${entry.sourceType}`);
    return toJournalEntryDto(entry);
  }

  async list(userId: string, params: ListJournalParams): Promise<ListJournalResult> {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, params.pageSize ?? DEFAULT_PAGE_SIZE));

    const where = {
      userId,
      // Default excludes both DELETED and ARCHIVED — an explicit `state` filter (including the
      // dedicated "recently deleted"/"archive" views) is the only way to see either. Matches
      // Memory's own default-list exclusion policy and archive()'s own "hides from the default
      // list" documentation.
      state: params.state ?? { notIn: ['DELETED', 'ARCHIVED'] as JournalState[] },
      ...(params.mood ? { mood: params.mood } : {}),
      ...(params.tag ? { tags: { has: params.tag } } : {}),
      ...(params.pinned !== undefined ? { pinned: params.pinned } : {}),
      ...(params.q
        ? {
            OR: [
              { title: { contains: params.q, mode: 'insensitive' as const } },
              { content: { contains: params.q, mode: 'insensitive' as const } },
            ],
          }
        : {}),
      ...(params.from || params.to
        ? { createdAt: { ...(params.from ? { gte: params.from } : {}), ...(params.to ? { lte: params.to } : {}) } }
        : {}),
    };

    const orderBy =
      params.sort === 'oldest'
        ? { createdAt: 'asc' as const }
        : params.sort === 'recently_edited'
          ? { updatedAt: 'desc' as const }
          : { createdAt: 'desc' as const };

    const [total, rows] = await Promise.all([
      this.prisma.journalEntry.count({ where }),
      this.prisma.journalEntry.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    if (params.q) this.logger.log(`Journal search: ${rows.length}/${total} matched`);

    return { items: rows.map(toJournalEntryDto), total, page, pageSize };
  }

  async getOne(userId: string, id: string): Promise<JournalEntryDto> {
    const entry = await this.findOwned(userId, id);
    return toJournalEntryDto(entry);
  }

  /**
   * Journal content genuinely is user-writable (unlike Memory) — see
   * docs/architecture/journal-foundation.md "Editing". Blocked for ARCHIVED/DELETED entries:
   * restore first, matching Memory's own "unarchive before editing" precedent so the two features
   * behave consistently from the user's point of view even though their underlying policies
   * differ.
   */
  async update(userId: string, id: string, params: UpdateJournalParams, opts: { isAutosave?: boolean; changeReason?: string } = {}): Promise<JournalEntryDto> {
    const entry = await this.findOwned(userId, id);
    if (entry.state === 'ARCHIVED') {
      throw new ConflictException({ code: 'JOURNAL_ARCHIVED', message: 'Restore this entry before editing it.' });
    }
    if (entry.state === 'DELETED') {
      throw new ConflictException({ code: 'JOURNAL_DELETED', message: 'Restore this entry before editing it.' });
    }
    if (Object.keys(params).length === 0) {
      return toJournalEntryDto(entry);
    }

    const nextTitle = params.title ?? entry.title;
    const nextContent = params.content ?? entry.content;
    const nextMood = params.mood !== undefined ? params.mood : entry.mood;
    const nextTags = params.tags ?? entry.tags;
    const nextVisibility = params.visibility ?? entry.visibility;
    const nextPinned = params.pinned !== undefined ? params.pinned : entry.pinned;
    const wordCount = countWords(nextContent);

    // A meaningful edit — see journal-foundation.md "Revisions": autosave ticks never version,
    // even when content changed; only an explicit save (or publish) does.
    const contentChanged = nextTitle !== entry.title || nextContent !== entry.content;
    const shouldVersion = !opts.isAutosave && contentChanged;
    const nextVersion = shouldVersion ? entry.version + 1 : entry.version;

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.journalEntry.update({
        where: { id },
        data: { title: nextTitle, content: nextContent, mood: nextMood, tags: nextTags, visibility: nextVisibility, pinned: nextPinned, wordCount, version: nextVersion },
      });
      if (shouldVersion) {
        await tx.journalRevision.create({
          data: {
            journalId: id,
            version: nextVersion,
            title: nextTitle,
            content: nextContent,
            mood: nextMood,
            tags: nextTags,
            changeReason: opts.changeReason ?? 'edited',
          },
        });
      }
      return result;
    });

    if (!opts.isAutosave) this.logger.log(`Journal edited id=${id} versioned=${shouldVersion}`);
    return toJournalEntryDto(updated);
  }

  /**
   * The draft-persistence loop (Phase 3) — only ever allowed while `state: 'DRAFT'`, and never
   * creates a JournalRevision (see `update()`'s `isAutosave` branch). Conflict-safe by being
   * last-write-wins on the same row within one owner's own session — there is no multi-writer
   * scenario to reconcile (Journal has no collaborative editing, per the mission's own
   * instruction), so no operational-transform/CRDT machinery is introduced.
   */
  async autosave(userId: string, id: string, params: UpdateJournalParams): Promise<{ entry: JournalEntryDto; savedAt: string }> {
    const entry = await this.findOwned(userId, id);
    if (entry.state !== 'DRAFT') {
      throw new ConflictException({ code: 'JOURNAL_NOT_DRAFT', message: 'Only a draft can be autosaved — publish or duplicate it to keep editing.' });
    }
    const updatedEntry = await this.update(userId, id, params, { isAutosave: true });
    this.logger.log(`Journal autosaved id=${id}`);
    return { entry: updatedEntry, savedAt: new Date().toISOString() };
  }

  /** DRAFT -> PUBLISHED. Always creates a revision, even if content is byte-identical to the
   * last one — "published" is itself a meaningful moment worth a snapshot boundary. */
  async publish(userId: string, id: string): Promise<JournalEntryDto> {
    const entry = await this.findOwned(userId, id);
    if (entry.state !== 'DRAFT') {
      throw new ConflictException({ code: 'JOURNAL_NOT_DRAFT', message: 'Only a draft can be published.' });
    }

    const nextVersion = entry.version + 1;
    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.journalEntry.update({
        where: { id },
        data: { state: 'PUBLISHED', publishedAt: new Date(), version: nextVersion },
      });
      await tx.journalRevision.create({
        data: { journalId: id, version: nextVersion, title: result.title, content: result.content, mood: result.mood, tags: result.tags, changeReason: 'published' },
      });
      return result;
    });

    this.logger.log(`Journal published id=${id}`);
    return toJournalEntryDto(updated);
  }

  /** Reversible — hides from the default list/timeline, keeps it fully recoverable via
   * `restore()`. Idempotent for an already-archived entry, matching Memory's own `archive()`. */
  async archive(userId: string, id: string): Promise<JournalEntryDto> {
    const entry = await this.findOwned(userId, id);
    if (entry.state === 'ARCHIVED') return toJournalEntryDto(entry);
    if (entry.state === 'DELETED') {
      throw new ConflictException({ code: 'JOURNAL_DELETED', message: 'Restore this entry before archiving it.' });
    }

    const updated = await this.prisma.journalEntry.update({
      where: { id },
      data: { state: 'ARCHIVED', previousState: entry.state, archivedAt: new Date() },
    });
    this.logger.log(`Journal archived id=${id}`);
    return toJournalEntryDto(updated);
  }

  /** Reverses either `archive()` or `remove()` — always returns to exactly the state the entry
   * was in immediately before, via `previousState`, never a guessed default. */
  async restore(userId: string, id: string): Promise<JournalEntryDto> {
    const entry = await this.findOwned(userId, id);
    if (entry.state !== 'ARCHIVED' && entry.state !== 'DELETED') {
      throw new ConflictException({ code: 'JOURNAL_NOT_ARCHIVED_OR_DELETED', message: 'Only an archived or deleted entry can be restored.' });
    }

    const target = entry.previousState ?? 'DRAFT';
    const updated = await this.prisma.journalEntry.update({
      where: { id },
      data: { state: target, previousState: null, archivedAt: null, deletedAt: null },
    });
    this.logger.log(`Journal restored id=${id} to=${target}`);
    return toJournalEntryDto(updated);
  }

  /**
   * Soft delete — a deliberate difference from Memory's hard delete, see
   * docs/architecture/journal-foundation.md "Lifecycle". Idempotent. No background purge sweep
   * exists this sprint (no new job/cron infrastructure introduced) — a `DELETED` entry with no
   * further action stays soft-deleted, excluded from every normal read, indefinitely; only the
   * owner, via the dedicated "recently deleted" view, can ever see or restore it again.
   */
  async remove(userId: string, id: string): Promise<JournalEntryDto> {
    const entry = await this.findOwned(userId, id);
    if (entry.state === 'DELETED') return toJournalEntryDto(entry);

    const updated = await this.prisma.journalEntry.update({
      where: { id },
      data: { state: 'DELETED', previousState: entry.state, deletedAt: new Date() },
    });
    this.logger.log(`Journal deleted id=${id}`);
    return toJournalEntryDto(updated);
  }

  /** Always creates a new DRAFT, regardless of the source entry's own state — a duplicate is a
   * fresh start the user reviews before publishing, never a second published entry created
   * silently. Blocked for a DELETED source (restore it first) for the same reason `update()` is. */
  async duplicate(userId: string, id: string): Promise<JournalEntryDto> {
    const entry = await this.findOwned(userId, id);
    if (entry.state === 'DELETED') {
      throw new ConflictException({ code: 'JOURNAL_DELETED', message: 'Restore this entry before duplicating it.' });
    }
    return this.create(userId, {
      title: `${entry.title} (copy)`,
      content: entry.content,
      mood: entry.mood ?? undefined,
      tags: entry.tags,
    });
  }

  async revisions(userId: string, id: string): Promise<JournalRevisionDto[]> {
    await this.findOwned(userId, id);
    const rows = await this.prisma.journalRevision.findMany({ where: { journalId: id }, orderBy: { version: 'desc' } });
    return rows.map((r) => ({
      version: r.version,
      title: r.title,
      content: r.content,
      mood: r.mood,
      tags: r.tags,
      changeReason: r.changeReason,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  /** Owner-scoped; deliberately does NOT filter by state, unlike `list()` — the detail view,
   * revision history, restore flow, and "recently deleted" view all need to reach an
   * archived/deleted entry directly by id. Cross-user access and non-existence are
   * indistinguishable (identical 404), matching Memory's own non-enumerability policy. */
  private async findOwned(userId: string, id: string): Promise<JournalEntry> {
    const entry = await this.prisma.journalEntry.findUnique({ where: { id } });
    if (!entry || entry.userId !== userId) {
      throw new NotFoundException({ code: 'JOURNAL_NOT_FOUND', message: 'That journal entry was not found.' });
    }
    return entry;
  }
}
