import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { CompanionMessage, OnboardingStage } from '@prisma/client';
import type { OnboardingMessageDto, OnboardingStateDto } from '@beaconvie/types';
import { PrismaService } from '../prisma/prisma.service';
import { MemoryService } from '../memory/memory.service';
import { ActivitiesService } from '../activities/activities.service';
import * as script from './conversation-script';

@Injectable()
export class OnboardingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly memoryService: MemoryService,
    private readonly activitiesService: ActivitiesService,
  ) {}

  async getState(userId: string): Promise<OnboardingStateDto> {
    const progress = await this.getOrCreateProgress(userId);

    if (progress.stage === 'WELCOME') {
      await this.appendMessage(userId, 'COMPANION', script.OPENING_MESSAGE);
      await this.prisma.onboardingProgress.update({
        where: { userId },
        data: { stage: 'MEET_COMPANION' },
      });
      return this.getState(userId);
    }

    const messages = await this.prisma.companionMessage.findMany({
      where: { userId, context: 'ONBOARDING' },
      orderBy: { createdAt: 'asc' },
    });

    return {
      stage: toDtoStage(progress.stage),
      messages: messages.map(toMessageDto),
      discoveryChoice: progress.discoveryChoice === 'ACCEPTED' ? 'accepted' : progress.discoveryChoice === 'SKIPPED' ? 'skipped' : null,
      completedAt: progress.completedAt ? progress.completedAt.toISOString() : null,
    };
  }

  async sendMessage(userId: string, content: string): Promise<OnboardingStateDto> {
    const progress = await this.getOrCreateProgress(userId);

    if (progress.stage === 'MEET_COMPANION') {
      await this.appendMessage(userId, 'USER', content);
      await this.appendMessage(userId, 'COMPANION', script.firstFollowUp(content));
      await this.prisma.onboardingProgress.update({
        where: { userId },
        data: { stage: 'CONVERSATION' },
      });
      return this.getState(userId);
    }

    if (progress.stage === 'CONVERSATION') {
      await this.appendMessage(userId, 'USER', content);
      await this.appendMessage(userId, 'COMPANION', script.reflectionMessage());

      await this.prisma.onboardingProgress.update({
        where: { userId },
        data: { stage: 'REFLECTION' },
      });
      return this.getState(userId);
    }

    throw new BadRequestException({
      code: 'ONBOARDING_STAGE_MISMATCH',
      message: "That doesn't fit here right now — refresh and try again.",
    });
  }

  /**
   * Explicit memory consent (Sprint 1 privacy requirement): the Companion asked
   * "want me to remember this?" in reflectionMessage() — nothing is written to
   * MemoryNote unless the user says yes here, and declining doesn't block
   * finishing onboarding.
   */
  async respondToMemoryConsent(userId: string, accepted: boolean): Promise<OnboardingStateDto> {
    const progress = await this.getOrCreateProgress(userId);

    if (progress.stage !== 'REFLECTION') {
      throw new BadRequestException({
        code: 'ONBOARDING_STAGE_MISMATCH',
        message: "That doesn't fit here right now — refresh and try again.",
      });
    }

    if (accepted) {
      const firstUserMessage = await this.prisma.companionMessage.findFirst({
        where: { userId, context: 'ONBOARDING', role: 'USER' },
        orderBy: { createdAt: 'asc' },
      });
      await this.memoryService.createNote(
        userId,
        script.memoryNoteContent(firstUserMessage?.content ?? ''),
        'ONBOARDING',
      );
      await this.appendMessage(userId, 'COMPANION', script.MEMORY_SAVED_MESSAGE);
    } else {
      await this.appendMessage(userId, 'COMPANION', script.MEMORY_DECLINED_MESSAGE);
    }

    await this.prisma.onboardingProgress.update({
      where: { userId },
      data: { stage: 'DISCOVERY_CHOICE' },
    });
    await this.appendMessage(userId, 'COMPANION', script.DISCOVERY_OFFER_MESSAGE);
    return this.getState(userId);
  }

  async selectDiscovery(userId: string, choice: 'accepted' | 'skipped'): Promise<OnboardingStateDto> {
    const progress = await this.getOrCreateProgress(userId);

    if (progress.stage !== 'DISCOVERY_CHOICE') {
      throw new BadRequestException({
        code: 'ONBOARDING_STAGE_MISMATCH',
        message: "That doesn't fit here right now — refresh and try again.",
      });
    }

    await this.appendMessage(
      userId,
      'COMPANION',
      choice === 'accepted' ? script.DISCOVERY_ACCEPTED_MESSAGE : script.DISCOVERY_SKIPPED_MESSAGE,
    );
    await this.appendMessage(userId, 'COMPANION', script.ACTIVATION_MESSAGE);

    await this.prisma.onboardingProgress.update({
      where: { userId },
      data: {
        stage: 'SUCCESS',
        discoveryChoice: choice === 'accepted' ? 'ACCEPTED' : 'SKIPPED',
      },
    });

    return this.getState(userId);
  }

  async complete(userId: string): Promise<void> {
    const progress = await this.getOrCreateProgress(userId);

    if (progress.stage !== 'SUCCESS') {
      throw new BadRequestException({
        code: 'ONBOARDING_NOT_READY',
        message: 'A few more steps to go before this is ready to complete.',
      });
    }

    if (progress.completedAt) return;

    await this.prisma.$transaction([
      this.prisma.onboardingProgress.update({
        where: { userId },
        data: { completedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { onboardingCompletedAt: new Date() },
      }),
    ]);

    await this.activitiesService.record(userId, 'ONBOARDING_COMPLETED');
  }

  /**
   * Skip is always available and never penalized (docs/reference Module 7 §12/§14):
   * the user lands on Dashboard with whatever memory already exists. Unlike
   * complete(), this finalizes onboarding from *any* stage — otherwise a skipped
   * user would be permanently redirected back to /onboarding by route guards,
   * which is exactly the "never trap users" failure this exists to avoid.
   */
  async skip(userId: string): Promise<void> {
    const progress = await this.getOrCreateProgress(userId);
    if (progress.completedAt) return;

    await this.prisma.$transaction([
      this.prisma.onboardingProgress.update({
        where: { userId },
        data: { stage: 'SUCCESS', completedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { onboardingCompletedAt: new Date() },
      }),
    ]);

    await this.activitiesService.record(userId, 'ONBOARDING_COMPLETED');
  }

  private async getOrCreateProgress(userId: string) {
    const progress = await this.prisma.onboardingProgress.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException();

    return progress;
  }

  private appendMessage(userId: string, role: 'USER' | 'COMPANION', content: string) {
    return this.prisma.companionMessage.create({
      data: { userId, role, content, context: 'ONBOARDING' },
    });
  }
}

function toDtoStage(stage: OnboardingStage): OnboardingStateDto['stage'] {
  return stage.toLowerCase() as OnboardingStateDto['stage'];
}

function toMessageDto(message: CompanionMessage): OnboardingMessageDto {
  return {
    id: message.id,
    role: message.role === 'USER' ? 'user' : 'companion',
    content: message.content,
    createdAt: message.createdAt.toISOString(),
  };
}
