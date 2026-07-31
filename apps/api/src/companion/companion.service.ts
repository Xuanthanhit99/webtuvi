import { Injectable } from '@nestjs/common';
import type { CompanionMessage } from '@prisma/client';
import type { CompanionMessageDto } from '@beaconvie/types';
import { PrismaService } from '../prisma/prisma.service';
import { MemoryService } from '../memory/memory.service';
import * as script from './companion-script';

const TRIVIALITY_MIN_WORDS = 4;

@Injectable()
export class CompanionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly memoryService: MemoryService,
  ) {}

  async recentMessages(userId: string, take = 20): Promise<CompanionMessageDto[]> {
    const messages = await this.prisma.companionMessage.findMany({
      where: { userId, context: 'COMPANION' },
      orderBy: { createdAt: 'desc' },
      take,
    });
    return messages.reverse().map(toDto);
  }

  async sendMessage(userId: string, content: string): Promise<CompanionMessageDto[]> {
    const priorCount = await this.prisma.companionMessage.count({
      where: { userId, context: 'COMPANION', role: 'USER' },
    });

    const userMessage = await this.prisma.companionMessage.create({
      data: { userId, role: 'USER', content, context: 'COMPANION' },
    });

    const replyText = script.replyTo(content, priorCount);
    const companionMessage = await this.prisma.companionMessage.create({
      data: { userId, role: 'COMPANION', content: replyText, context: 'COMPANION' },
    });

    // Lightweight triviality filter (docs/reference Module 3): don't turn every
    // short reply into a "memory" — only genuinely substantive first messages are.
    if (content.trim().split(/\s+/).length >= TRIVIALITY_MIN_WORDS) {
      await this.memoryService.createNote(userId, `Remembered: ${content.trim()}`, 'COMPANION');
    }

    return [toDto(userMessage), toDto(companionMessage)];
  }
}

function toDto(message: CompanionMessage): CompanionMessageDto {
  return {
    id: message.id,
    role: message.role === 'USER' ? 'user' : 'companion',
    content: message.content,
    createdAt: message.createdAt.toISOString(),
  };
}
