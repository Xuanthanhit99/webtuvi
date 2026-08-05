import type { ActivityEvent, ConversationMessage, JournalEntry, Memory } from '@prisma/client';
import type { ReflectionGoalConflict, ReflectionUserData } from './reflection.types';

export const USER_ID = 'user-1';

export function makeJournal(overrides: Partial<JournalEntry> = {}): JournalEntry {
  return {
    id: overrides.id ?? 'journal-1',
    userId: overrides.userId ?? USER_ID,
    title: overrides.title ?? 'Title',
    content: overrides.content ?? 'Content',
    state: overrides.state ?? 'PUBLISHED',
    previousState: overrides.previousState ?? null,
    visibility: overrides.visibility ?? 'PRIVATE',
    mood: overrides.mood ?? null,
    tags: overrides.tags ?? [],
    pinned: overrides.pinned ?? false,
    wordCount: overrides.wordCount ?? 2,
    version: overrides.version ?? 1,
    sourceType: overrides.sourceType ?? 'USER',
    sourceConversationId: overrides.sourceConversationId ?? null,
    sourceMessageId: overrides.sourceMessageId ?? null,
    createdAt: overrides.createdAt ?? new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: overrides.updatedAt ?? overrides.createdAt ?? new Date('2026-01-01T00:00:00.000Z'),
    publishedAt: overrides.publishedAt ?? new Date('2026-01-01T00:00:00.000Z'),
    archivedAt: overrides.archivedAt ?? null,
    deletedAt: overrides.deletedAt ?? null,
  };
}

export function makeMemory(overrides: Partial<Memory> = {}): Memory {
  return {
    id: overrides.id ?? 'memory-1',
    userId: overrides.userId ?? USER_ID,
    type: overrides.type ?? 'CUSTOM',
    title: overrides.title ?? 'Title',
    summary: overrides.summary ?? 'Summary',
    structuredPayload: overrides.structuredPayload ?? null,
    status: overrides.status ?? 'ACCEPTED',
    consentState: overrides.consentState ?? 'ALLOW_SELECTED',
    visibility: overrides.visibility ?? 'PRIVATE',
    sourceType: overrides.sourceType ?? 'USER_EXPLICIT',
    sourceConversationId: overrides.sourceConversationId ?? null,
    sourceMessageId: overrides.sourceMessageId ?? null,
    expiresAt: overrides.expiresAt ?? null,
    version: overrides.version ?? 1,
    lastReferencedAt: overrides.lastReferencedAt ?? null,
    createdAt: overrides.createdAt ?? new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: overrides.updatedAt ?? overrides.createdAt ?? new Date('2026-01-01T00:00:00.000Z'),
    archivedAt: overrides.archivedAt ?? null,
    deletedAt: overrides.deletedAt ?? null,
    importanceScore: overrides.importanceScore ?? 0,
    importanceFactors: overrides.importanceFactors ?? null,
    pinned: overrides.pinned ?? false,
    referencedCount: overrides.referencedCount ?? 0,
  };
}

export function makeActivity(overrides: Partial<ActivityEvent> = {}): ActivityEvent {
  return {
    id: overrides.id ?? 'activity-1',
    userId: overrides.userId ?? USER_ID,
    type: overrides.type ?? 'PREFERENCE_UPDATED',
    metadata: overrides.metadata ?? null,
    createdAt: overrides.createdAt ?? new Date('2026-01-01T00:00:00.000Z'),
  };
}

export function makeCompanionMessage(overrides: Partial<ConversationMessage> = {}): ConversationMessage {
  return {
    id: overrides.id ?? 'message-1',
    conversationId: overrides.conversationId ?? 'conversation-1',
    role: overrides.role ?? 'USER',
    content: overrides.content ?? 'A message',
    metadata: overrides.metadata ?? null,
    createdAt: overrides.createdAt ?? new Date('2026-01-01T00:00:00.000Z'),
  };
}

export function makeUserData(overrides: Partial<ReflectionUserData> = {}): ReflectionUserData {
  return {
    userId: overrides.userId ?? USER_ID,
    journals: overrides.journals ?? [],
    memories: overrides.memories ?? [],
    goalMemories: overrides.goalMemories ?? [],
    activityEvents: overrides.activityEvents ?? [],
    companionMessages: overrides.companionMessages ?? [],
    goalConflicts: overrides.goalConflicts ?? [],
  };
}

export function makeGoalConflict(overrides: Partial<ReflectionGoalConflict> = {}): ReflectionGoalConflict {
  return {
    id: overrides.id ?? 'conflict-1',
    memoryAId: overrides.memoryAId ?? 'memory-1',
    memoryBId: overrides.memoryBId ?? 'memory-2',
    reason: overrides.reason ?? 'Different target dates.',
    detectedAt: overrides.detectedAt ?? new Date('2026-01-05T00:00:00.000Z'),
  };
}

const DAY_MS = 24 * 60 * 60 * 1000;
export function daysAgo(n: number, from = new Date('2026-01-20T00:00:00.000Z')): Date {
  return new Date(from.getTime() - n * DAY_MS);
}
