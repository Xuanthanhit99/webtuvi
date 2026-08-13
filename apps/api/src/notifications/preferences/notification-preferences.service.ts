import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { UpdateNotificationPreferencesDto } from '../dto/update-notification-preferences.dto';

export interface NotificationPreferencesDto {
  reminderInApp: boolean;
  reminderEmail: boolean;
}

/** Schema defaults (schema.prisma `NotificationPreference`) — mirrored here so `resolve()` can
 * return a correct answer for a user who has never saved a row, without writing one on a mere
 * read. */
const DEFAULTS: NotificationPreferencesDto = { reminderInApp: true, reminderEmail: false };

/**
 * Sprint 11. One row per user, created lazily on first write (`update()`), never at registration —
 * most users will never touch this, and a mass-insert of default rows for every existing user
 * would be pure waste. Reads (`resolve()`) never write, matching `UsersController`'s
 * `preferences` pattern of returning defaults when no row exists yet.
 */
@Injectable()
export class NotificationPreferencesService {
  constructor(private readonly prisma: PrismaService) {}

  async resolve(userId: string): Promise<NotificationPreferencesDto> {
    const row = await this.prisma.notificationPreference.findUnique({ where: { userId } });
    if (!row) return DEFAULTS;
    return { reminderInApp: row.reminderInApp, reminderEmail: row.reminderEmail };
  }

  async update(userId: string, dto: UpdateNotificationPreferencesDto): Promise<NotificationPreferencesDto> {
    const current = await this.resolve(userId);
    const next: NotificationPreferencesDto = {
      reminderInApp: dto.reminderInApp ?? current.reminderInApp,
      reminderEmail: dto.reminderEmail ?? current.reminderEmail,
    };
    const row = await this.prisma.notificationPreference.upsert({
      where: { userId },
      create: { userId, ...next },
      update: next,
    });
    return { reminderInApp: row.reminderInApp, reminderEmail: row.reminderEmail };
  }
}
