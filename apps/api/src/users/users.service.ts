import { Injectable } from '@nestjs/common';
import type { User } from '@prisma/client';
import type { UserDto, UserPreferenceDto } from '@beaconvie/types';
import { PrismaService } from '../prisma/prisma.service';
import { ActivitiesService } from '../activities/activities.service';
import type { UpdatePreferencesDto } from './dto/update-preferences.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activitiesService: ActivitiesService,
  ) {}

  normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email: this.normalizeEmail(email) } });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  toDto(user: User): UserDto {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      emailVerifiedAt: user.emailVerifiedAt ? user.emailVerifiedAt.toISOString() : null,
      onboardingCompletedAt: user.onboardingCompletedAt ? user.onboardingCompletedAt.toISOString() : null,
      createdAt: user.createdAt.toISOString(),
      role: user.role,
    };
  }

  async getPreferences(userId: string): Promise<UserPreferenceDto> {
    const preference = await this.prisma.userPreference.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
    return this.preferenceToDto(preference);
  }

  async updatePreferences(userId: string, dto: UpdatePreferencesDto): Promise<UserPreferenceDto> {
    const preference = await this.prisma.userPreference.upsert({
      where: { userId },
      update: dto,
      create: { userId, ...dto },
    });
    await this.activitiesService.record(userId, 'PREFERENCE_UPDATED');
    return this.preferenceToDto(preference);
  }

  private preferenceToDto(preference: {
    memoryPreference: UserPreferenceDto['memoryPreference'];
    reflectionFrequency: UserPreferenceDto['reflectionFrequency'];
    checkInTime: string | null;
  }): UserPreferenceDto {
    return {
      memoryPreference: preference.memoryPreference,
      reflectionFrequency: preference.reflectionFrequency,
      checkInTime: preference.checkInTime,
    };
  }
}
