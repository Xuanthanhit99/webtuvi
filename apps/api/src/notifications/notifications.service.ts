import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, type Notification } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NOTIFICATION_TYPE_META, type NotificationType } from './notifications.types';
import { toNotificationDto, type NotificationDto } from './notifications.mappers';

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  deepLink?: string | null;
  /** Deterministic idempotency key — see schema.prisma `Notification.dedupeKey` doc comment. */
  dedupeKey: string;
}

export interface CreateNotificationResult {
  notification: Notification;
  /** `false` means a row with this exact `(userId, dedupeKey)` already existed — the DB unique
   * constraint caught it, this call was a safe no-op, and the caller (delivery/scheduler) must
   * not re-send email for it. This is the actual idempotency mechanism (Sprint 11 brief §12),
   * mirroring `PaymentWebhookService.recordEventOrNull`'s identical precedent. */
  created: boolean;
}

export interface ListNotificationsParams {
  page?: number;
  pageSize?: number;
  unreadOnly?: boolean;
}

export interface ListNotificationsResult {
  items: NotificationDto[];
  total: number;
  page: number;
  pageSize: number;
}

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

/**
 * Sprint 11 — Notification & Retention Foundation. Owner-scoped CRUD only; deciding *whether* a
 * notification is warranted lives entirely in the eligibility engines (`eligibility/`), never
 * here — this service has no opinion about what's worth notifying about, only about persisting
 * and reading what already cleared that bar.
 */
@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateNotificationInput): Promise<CreateNotificationResult> {
    const meta = NOTIFICATION_TYPE_META[input.type];
    try {
      const notification = await this.prisma.notification.create({
        data: {
          userId: input.userId,
          category: meta.category,
          class: meta.class,
          type: input.type,
          title: input.title,
          body: input.body,
          deepLink: input.deepLink ?? null,
          dedupeKey: input.dedupeKey,
        },
      });
      return { notification, created: true };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const existing = await this.prisma.notification.findUniqueOrThrow({
          where: { userId_dedupeKey: { userId: input.userId, dedupeKey: input.dedupeKey } },
        });
        return { notification: existing, created: false };
      }
      throw error;
    }
  }

  async list(userId: string, params: ListNotificationsParams): Promise<ListNotificationsResult> {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, params.pageSize ?? DEFAULT_PAGE_SIZE));
    const skip = (page - 1) * pageSize;

    const where: Prisma.NotificationWhereInput = { userId, ...(params.unreadOnly ? { readAt: null } : {}) };

    const [total, rows] = await Promise.all([
      this.prisma.notification.count({ where }),
      this.prisma.notification.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: pageSize }),
    ]);

    return { items: rows.map(toNotificationDto), total, page, pageSize };
  }

  async unreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({ where: { userId, readAt: null } });
  }

  async markRead(userId: string, id: string): Promise<NotificationDto> {
    const existing = await this.findOwned(userId, id);
    if (existing.readAt) return toNotificationDto(existing); // idempotent no-op
    const updated = await this.prisma.notification.update({ where: { id }, data: { readAt: new Date() } });
    return toNotificationDto(updated);
  }

  async markAllRead(userId: string): Promise<{ updatedCount: number }> {
    const result = await this.prisma.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } });
    return { updatedCount: result.count };
  }

  /** Owner-scoped fetch — 404s identically for "doesn't exist" and "belongs to someone else"
   * (same IDOR-safe convention as every other feature's `findOwned`, e.g. `TarotRecordService`). */
  private async findOwned(userId: string, id: string): Promise<Notification> {
    const notification = await this.prisma.notification.findUnique({ where: { id } });
    if (!notification || notification.userId !== userId) {
      throw new NotFoundException({ code: 'NOTIFICATION_NOT_FOUND', message: 'That notification was not found.' });
    }
    return notification;
  }
}
