import { HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import type { Conversation, ConversationMessage } from '@prisma/client';
import type { ConversationDto, ConversationMessageDto } from '@beaconvie/types';
import { PrismaService } from '../../prisma/prisma.service';
import { SafetyService } from '../safety/safety.service';
import { CostControlService } from '../cost/cost-control.service';
import { MemorySuggestionService, type MemorySuggestionDto } from '../memory/memory-suggestion.service';
import { CompanionForgetService, type ForgetSuggestionDto } from '../memory/companion-forget.service';
import { CompanionJournalService, type JournalSuggestionResult } from '../journal/companion-journal.service';

export interface SendMessageResult {
  userMessage: ConversationMessageDto;
  /** Set only when the message was safety-refused — no generation is triggered, the frontend never opens the stream. */
  assistantMessage: ConversationMessageDto | null;
  requiresGeneration: boolean;
  /** Sprint 3C, Phase 4 — "this sounds worth remembering." Never persisted by itself; the
   * frontend's "Remember" button is what actually creates anything (see memory-api.ts's
   * existing propose+accept flow). Null whenever nothing matched or consent already excludes
   * that type ("Never remember this type" is respected here too). */
  memorySuggestion: MemorySuggestionDto | null;
  /** Sprint 3C, Phase 5 — detected forget-intent, never executed without a separate, explicit
   * confirmation call (see CompanionMemoryController). */
  forgetSuggestion: ForgetSuggestionDto | null;
  /** Sprint 4A, Phase 8 — "This might be worth saving as a journal entry." Never persisted by
   * itself; "Save as Journal" is what actually creates a (draft) journal entry (see
   * CompanionJournalController). Null whenever nothing matched or the user has turned journal
   * suggestions off entirely ("Never suggest again"). */
  journalSuggestion: JournalSuggestionResult | null;
}

const RECENT_MESSAGES_PREVIEW = 1;

@Injectable()
export class ConversationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly safety: SafetyService,
    private readonly costControl: CostControlService,
    private readonly memorySuggestion: MemorySuggestionService,
    private readonly forget: CompanionForgetService,
    private readonly journalSuggestion: CompanionJournalService,
  ) {}

  async create(userId: string, title: string | undefined): Promise<ConversationDto> {
    const conversation = await this.prisma.conversation.create({
      data: { userId, title },
    });
    return toConversationDto(conversation, 0);
  }

  async list(userId: string): Promise<ConversationDto[]> {
    const conversations = await this.prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: { _count: { select: { messages: true } } },
    });
    return conversations.map((c) => toConversationDto(c, c._count.messages));
  }

  async getOne(userId: string, id: string): Promise<{ conversation: ConversationDto; messages: ConversationMessageDto[] }> {
    const conversation = await this.findOwned(userId, id);
    const messages = await this.prisma.conversationMessage.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: 'asc' },
    });
    const messageCount = messages.length;
    return { conversation: toConversationDto(conversation, messageCount), messages: messages.map(toMessageDto) };
  }

  async delete(userId: string, id: string): Promise<void> {
    await this.findOwned(userId, id);
    await this.prisma.conversation.delete({ where: { id } });
  }

  /**
   * Persists the user's message. If it fails the safety check, also persists
   * a fixed refusal message immediately and signals the caller (controller)
   * that no generation should be triggered — the LLM is never called for a
   * refused message.
   *
   * Checked before any of that: the caller's usage budget (daily request/token,
   * monthly token — see CostControlService.checkBudget). A budget breach never
   * persists anything and never reaches the safety check or a provider —
   * it's a clean, normalized 429 (AI_BUDGET_EXCEEDED), not a fabricated reply.
   */
  async sendMessage(userId: string, conversationId: string, content: string): Promise<SendMessageResult> {
    await this.findOwned(userId, conversationId);

    const budget = await this.costControl.checkBudget(userId);
    if (!budget.allowed) {
      throw new HttpException({ code: 'AI_BUDGET_EXCEEDED', message: budget.message }, HttpStatus.TOO_MANY_REQUESTS);
    }

    const safetyResult = this.safety.checkInput(content);

    const userMessage = await this.prisma.conversationMessage.create({
      data: { conversationId, role: 'USER', content },
    });
    await this.touchConversation(conversationId);

    if (!safetyResult.allowed) {
      const assistantMessage = await this.prisma.conversationMessage.create({
        data: {
          conversationId,
          role: 'ASSISTANT',
          content: safetyResult.refusalMessage!,
          metadata: { safetyRefused: true, category: safetyResult.category },
        },
      });
      await this.touchConversation(conversationId);

      return {
        userMessage: toMessageDto(userMessage),
        assistantMessage: toMessageDto(assistantMessage),
        requiresGeneration: false,
        // A safety-refused message is never evaluated for a memory/journal suggestion or
        // forget-intent — it was never actually processed as real conversational content.
        memorySuggestion: null,
        forgetSuggestion: null,
        journalSuggestion: null,
      };
    }

    // Sprint 3C Phases 4/5 + Sprint 4A Phase 8 — deterministic, non-LLM heuristics only (see
    // memory-suggestion-detector.ts/forget-intent-detector.ts/journal-suggestion-detector.ts).
    // None of these ever saves, deletes, or changes consent/settings by itself; all three are
    // pure "here's what I noticed" signals the frontend renders as an explicit choice.
    const [memorySuggestion, forgetSuggestion, journalSuggestion] = await Promise.all([
      this.memorySuggestion.evaluate(userId, content),
      this.forget.evaluate(userId, conversationId, content),
      this.journalSuggestion.evaluate(userId, content),
    ]);

    return { userMessage: toMessageDto(userMessage), assistantMessage: null, requiresGeneration: true, memorySuggestion, forgetSuggestion, journalSuggestion };
  }

  /** Ownership check shared by every mutating/reading method — 404 (not 403) for someone else's conversation, so existence can't be probed. */
  async findOwned(userId: string, id: string): Promise<Conversation> {
    const conversation = await this.prisma.conversation.findUnique({ where: { id } });
    if (!conversation || conversation.userId !== userId) {
      throw new NotFoundException({ code: 'CONVERSATION_NOT_FOUND', message: 'That conversation was not found.' });
    }
    return conversation;
  }

  private async touchConversation(id: string): Promise<void> {
    await this.prisma.conversation.update({ where: { id }, data: { updatedAt: new Date() } });
  }
}

function toConversationDto(conversation: Conversation, messageCount: number): ConversationDto {
  return {
    id: conversation.id,
    title: conversation.title,
    status: conversation.status === 'ACTIVE' ? 'active' : 'archived',
    messageCount,
    createdAt: conversation.createdAt.toISOString(),
    updatedAt: conversation.updatedAt.toISOString(),
  };
}

function toMessageDto(message: ConversationMessage): ConversationMessageDto {
  const metadata = message.metadata as { memoryUsage?: { used: ConversationMessageDto['memoryUsed'] } } | null;
  return {
    id: message.id,
    role: message.role.toLowerCase() as ConversationMessageDto['role'],
    content: message.content,
    createdAt: message.createdAt.toISOString(),
    // Sprint 3C — the persisted, structural-only reference list (see StreamService). Present
    // whenever this message actually used memory, on reload as much as right after generation
    // ("later retrieval" in the Phase 13 flow) — `null` for every message that didn't, including
    // every message that predates this sprint.
    memoryUsed: metadata?.memoryUsage?.used ?? null,
  };
}

// Exported for the stream service, which needs the same mapping. Preview limit
// exists so it stays a deliberate, documented constant rather than a magic number.
export { toMessageDto, RECENT_MESSAGES_PREVIEW };
