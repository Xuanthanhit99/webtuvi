import type { Notification } from '@prisma/client';

export interface NotificationDto {
  id: string;
  category: string;
  class: string;
  type: string;
  title: string;
  body: string;
  deepLink: string | null;
  read: boolean;
  createdAt: string;
}

export function toNotificationDto(notification: Notification): NotificationDto {
  return {
    id: notification.id,
    category: notification.category,
    class: notification.class,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    deepLink: notification.deepLink,
    read: notification.readAt !== null,
    createdAt: notification.createdAt.toISOString(),
  };
}
