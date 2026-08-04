import { Injectable, Logger } from '@nestjs/common';
import type { Memory, MemoryType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { MemoryRecordService } from '../../memory/record/memory-record.service';
import { MemoryConsentService } from '../../memory/consent/memory-consent.service';
import { significantTokens, jaccardSimilarity } from '../../memory/shared/text-normalization.util';
import { detectForgetIntent, type DetectedForgetIntent } from './forget-intent-detector';

const DELETE_ABOUT_SIMILARITY_THRESHOLD = 0.2;
const DELETE_ABOUT_MAX_CANDIDATES = 5;
/** Bounds the "forget that" / "delete everything about" scan — matches the rest of Memory
 * Intelligence's O(n) candidate-scan limits (see memory-intelligence.md "Known limitations"). */
const SCAN_LIMIT = 300;

export interface ForgetCandidateDto {
  memoryId: string;
  title: string;
  summary: string;
  type: MemoryType;
}

export interface ForgetSuggestionDto {
  kind: DetectedForgetIntent['kind'];
  message: string;
  candidates: ForgetCandidateDto[];
  type: MemoryType | null;
}

/**
 * Maps a detected forget-intent to real candidates from the Memory API — and only ever
 * *suggests* an action. Nothing is deleted and no consent is changed until the user explicitly
 * confirms via `confirmDelete()`/`confirmNeverRemember()`, called only from a dedicated,
 * ownership-checked endpoint the frontend hits after the user clicks "Yes." This is Phase 5's
 * "safe mapping to Memory API" — free-text chat intent is never itself sufficient authorization
 * to delete or change consent. See docs/architecture/companion-memory-integration.md
 * "Forget flow".
 */
@Injectable()
export class CompanionForgetService {
  private readonly logger = new Logger('CompanionForget');

  constructor(
    private readonly prisma: PrismaService,
    private readonly records: MemoryRecordService,
    private readonly consent: MemoryConsentService,
  ) {}

  async evaluate(userId: string, conversationId: string, messageContent: string): Promise<ForgetSuggestionDto | null> {
    const intent = detectForgetIntent(messageContent);
    if (!intent) return null;

    switch (intent.kind) {
      case 'FORGET_RECENT':
        return this.resolveForgetRecent(userId, conversationId);
      case 'NEVER_REMEMBER_TYPE':
        return this.resolveNeverRememberType(intent.type!);
      case 'DELETE_ABOUT':
        return this.resolveDeleteAbout(userId, intent.topic!);
    }
  }

  /** Ownership is enforced by `MemoryRecordService.remove()` itself (userId-scoped) — this is a
   * thin, explicit-confirmation wrapper, not a new authorization path. */
  async confirmDelete(userId: string, memoryIds: string[]): Promise<void> {
    for (const memoryId of memoryIds) {
      await this.records.remove(userId, memoryId);
    }
    this.logger.log(`Forget confirmed: ${memoryIds.length} memories deleted`);
  }

  /** Reuses the existing consent mutation — identical effect to the Settings page's own "deny
   * this type" control, just reached from a chat confirmation instead. */
  async confirmNeverRemember(userId: string, type: MemoryType): Promise<void> {
    await this.consent.updateType(userId, type, 'DENY_TYPE');
    this.logger.log(`Forget confirmed: consent set to DENY_TYPE for type=${type}`);
  }

  private async resolveForgetRecent(userId: string, conversationId: string): Promise<ForgetSuggestionDto> {
    const memory = await this.prisma.memory.findFirst({
      where: { userId, status: 'ACCEPTED', sourceConversationId: conversationId },
      orderBy: { createdAt: 'desc' },
    });
    if (!memory) {
      return {
        kind: 'FORGET_RECENT',
        message: "I don't have anything saved from this conversation yet, so there's nothing to forget.",
        candidates: [],
        type: null,
      };
    }
    return {
      kind: 'FORGET_RECENT',
      message: 'Want me to delete this?',
      candidates: [toCandidateDto(memory)],
      type: null,
    };
  }

  private resolveNeverRememberType(type: MemoryType): ForgetSuggestionDto {
    return {
      kind: 'NEVER_REMEMBER_TYPE',
      message: `Want me to stop remembering ${type.toLowerCase().replace('_', ' ')} memories from now on? You can change this anytime in Settings.`,
      candidates: [],
      type,
    };
  }

  private async resolveDeleteAbout(userId: string, topic: string): Promise<ForgetSuggestionDto> {
    const topicTokens = significantTokens(topic);
    if (topicTokens.length === 0) {
      return { kind: 'DELETE_ABOUT', message: "I couldn't tell what you meant — could you be more specific?", candidates: [], type: null };
    }

    const memories = await this.prisma.memory.findMany({
      where: { userId, status: 'ACCEPTED' },
      orderBy: { createdAt: 'desc' },
      take: SCAN_LIMIT,
    });

    const scored = memories
      .map((memory) => ({
        memory,
        score: jaccardSimilarity(topicTokens, significantTokens(`${memory.title} ${memory.summary}`)),
      }))
      .filter((entry) => entry.score >= DELETE_ABOUT_SIMILARITY_THRESHOLD)
      .sort((a, b) => b.score - a.score)
      .slice(0, DELETE_ABOUT_MAX_CANDIDATES);

    if (scored.length === 0) {
      return {
        kind: 'DELETE_ABOUT',
        message: `I couldn't find anything saved about "${topic}".`,
        candidates: [],
        type: null,
      };
    }

    return {
      kind: 'DELETE_ABOUT',
      message: `I found ${scored.length} ${scored.length === 1 ? 'memory' : 'memories'} that might match "${topic}". Want me to delete ${scored.length === 1 ? 'it' : 'them'}?`,
      candidates: scored.map((entry) => toCandidateDto(entry.memory)),
      type: null,
    };
  }
}

function toCandidateDto(memory: Memory): ForgetCandidateDto {
  return { memoryId: memory.id, title: memory.title, summary: memory.summary, type: memory.type };
}
