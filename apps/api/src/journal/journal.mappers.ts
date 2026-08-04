import type { JournalEntry, JournalMood, JournalSourceType, JournalState, JournalVisibility } from '@prisma/client';

export interface JournalEntryDto {
  id: string;
  title: string;
  content: string;
  state: JournalState;
  visibility: JournalVisibility;
  mood: JournalMood | null;
  tags: string[];
  pinned: boolean;
  wordCount: number;
  readingTimeMinutes: number;
  version: number;
  sourceType: JournalSourceType;
  sourceConversationId: string | null;
  sourceMessageId: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  archivedAt: string | null;
}

const AVERAGE_WORDS_PER_MINUTE = 200;

/** Deterministic, computed from the already-stored `wordCount` — never a separate stored field
 * that could drift from the content it's describing. Rounded up so a very short entry still
 * reads "1 min," never "0 min." */
export function readingTimeMinutesFor(wordCount: number): number {
  if (wordCount === 0) return 0;
  return Math.max(1, Math.ceil(wordCount / AVERAGE_WORDS_PER_MINUTE));
}

export function countWords(content: string): number {
  const trimmed = content.trim();
  return trimmed.length === 0 ? 0 : trimmed.split(/\s+/).length;
}

/** Shared by every Journal surface (record, timeline, search, export, Companion suggestion) so
 * they all render an identical shape. Never includes `deletedAt`/`previousState` — internal
 * lifecycle bookkeeping, not something the client needs to render. */
export function toJournalEntryDto(entry: JournalEntry): JournalEntryDto {
  return {
    id: entry.id,
    title: entry.title,
    content: entry.content,
    state: entry.state,
    visibility: entry.visibility,
    mood: entry.mood,
    tags: entry.tags,
    pinned: entry.pinned,
    wordCount: entry.wordCount,
    readingTimeMinutes: readingTimeMinutesFor(entry.wordCount),
    version: entry.version,
    sourceType: entry.sourceType,
    sourceConversationId: entry.sourceConversationId,
    sourceMessageId: entry.sourceMessageId,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
    publishedAt: entry.publishedAt?.toISOString() ?? null,
    archivedAt: entry.archivedAt?.toISOString() ?? null,
  };
}
