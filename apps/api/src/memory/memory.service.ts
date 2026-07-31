import { Injectable } from '@nestjs/common';
import type { MemorySource } from '@prisma/client';
import type { MemoryNoteDto } from '@beaconvie/types';
import { PrismaService } from '../prisma/prisma.service';
import { ActivitiesService } from '../activities/activities.service';

/**
 * Memory has no dedicated route/controller in Sprint 1 (docs/reference
 * Module 3: "Memory — infra only, no direct UI"). It only surfaces inside
 * Onboarding's Reflection step and Dashboard's Memory Highlight panel.
 */
@Injectable()
export class MemoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activitiesService: ActivitiesService,
  ) {}

  async createNote(userId: string, content: string, source: MemorySource): Promise<MemoryNoteDto> {
    const note = await this.prisma.memoryNote.create({ data: { userId, content, source } });
    await this.activitiesService.record(userId, 'MEMORY_CREATED', { source });
    return this.toDto(note);
  }

  async mostRecent(userId: string): Promise<MemoryNoteDto | null> {
    const note = await this.prisma.memoryNote.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return note ? this.toDto(note) : null;
  }

  private toDto(note: { id: string; content: string; source: MemorySource; createdAt: Date }): MemoryNoteDto {
    return {
      id: note.id,
      content: note.content,
      source: note.source === 'ONBOARDING' ? 'onboarding' : 'companion',
      createdAt: note.createdAt.toISOString(),
    };
  }
}
