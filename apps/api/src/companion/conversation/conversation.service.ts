import { Injectable, NotFoundException } from '@nestjs/common';
import type { Conversation, ConversationMessage } from '@prisma/client';
import type { ConversationDto, ConversationMessageDto } from '@beaconvie/types';
import { PrismaService } from '../../prisma/prisma.service';
import { SafetyService } from '../safety/safety.service';

export interface SendMessageResult {
  userMessage: ConversationMessageDto;
  /** Set only when the message was safety-refused — no generation is triggered, the frontend never opens the stream. */
  assistantMessage: ConversationMessageDto | null;
  requiresGeneration: boolean;
}

const RECENT_MESSAGES_PREVIEW = 1;

@Injectable()
export class ConversationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly safety: SafetyService,
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
   */
  async sendMessage(userId: string, conversationId: string, content: string): Promise<SendMessageResult> {
    await this.findOwned(userId, conversationId);

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

      return { userMessage: toMessageDto(userMessage), assistantMessage: toMessageDto(assistantMessage), requiresGeneration: false };
    }

    return { userMessage: toMessageDto(userMessage), assistantMessage: null, requiresGeneration: true };
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
  return {
    id: message.id,
    role: message.role.toLowerCase() as ConversationMessageDto['role'],
    content: message.content,
    createdAt: message.createdAt.toISOString(),
  };
}

// Exported for the stream service, which needs the same mapping. Preview limit
// exists so it stays a deliberate, documented constant rather than a magic number.
export { toMessageDto, RECENT_MESSAGES_PREVIEW };
