import { Injectable } from '@nestjs/common';
import type { ActivityType, Prisma } from '@prisma/client';
import type { DashboardActivityItemDto } from '@beaconvie/types';
import { PrismaService } from '../prisma/prisma.service';

const ACTIVITY_LABELS: Record<ActivityType, string> = {
  ACCOUNT_CREATED: 'Account created',
  ONBOARDING_COMPLETED: 'Onboarding completed',
  PREFERENCE_UPDATED: 'Preference updated',
  MEMORY_CREATED: 'A memory was created',
};

@Injectable()
export class ActivitiesService {
  constructor(private readonly prisma: PrismaService) {}

  record(userId: string, type: ActivityType, metadata?: Prisma.InputJsonValue) {
    return this.prisma.activityEvent.create({
      data: { userId, type, metadata },
    });
  }

  async recent(userId: string, take = 5): Promise<DashboardActivityItemDto[]> {
    const events = await this.prisma.activityEvent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take,
    });

    return events.map((event) => ({
      type: mapType(event.type),
      label: ACTIVITY_LABELS[event.type],
      createdAt: event.createdAt.toISOString(),
    }));
  }
}

function mapType(type: ActivityType): DashboardActivityItemDto['type'] {
  switch (type) {
    case 'ACCOUNT_CREATED':
      return 'account_created';
    case 'ONBOARDING_COMPLETED':
      return 'onboarding_completed';
    case 'PREFERENCE_UPDATED':
      return 'preference_updated';
    case 'MEMORY_CREATED':
      return 'memory_created';
  }
}
