import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Notification } from '@prisma/client';
import type { AppConfiguration } from '../../config/configuration';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../../mail/mail.service';

const MAX_ATTEMPTS = 2;

/**
 * Sprint 11 — the EMAIL side of the two delivery channels (Sprint 11 brief §2's architecture
 * diagram). IN_APP delivery needs no separate code path: a `Notification` row's mere existence
 * (created by `NotificationsService.create`) *is* its in-app delivery — this service exists only
 * because EMAIL is the one channel that can fail independently and needs its own tracked state
 * (`emailStatus`/`emailAttemptedAt`/`emailError`, see schema.prisma `Notification` doc comment).
 *
 * A small, bounded (not infinite) retry: at most `MAX_ATTEMPTS` synchronous send attempts within
 * this one call, no queue, no backoff infrastructure — per Sprint 11 brief §18 ("small bounded
 * strategy... do not create infinite retries"). There is no cross-run retry: if both attempts
 * fail, `emailStatus` is left `FAILED` and the next scheduler run does not retry it, because the
 * underlying Notification row already exists (dedupe would no-op a second create) — a disclosed
 * limitation, not a silent gap (see docs/architecture/notification-retention.md "Email
 * failure/retry").
 */
@Injectable()
export class NotificationDeliveryService {
  private readonly logger = new Logger('NotificationDelivery');

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly configService: ConfigService,
  ) {}

  async deliverEmail(notification: Notification, to: string, ctaLabel: string): Promise<void> {
    const config = this.configService.get<AppConfiguration>('app')!;
    const ctaUrl = buildDeepLinkUrl(config.appPublicUrl, notification.deepLink);

    await this.prisma.notification.update({ where: { id: notification.id }, data: { emailAttemptedAt: new Date() } });

    let sent = false;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS && !sent; attempt++) {
      sent = await this.mail.sendNotificationEmail(to, notification.title, notification.body, ctaLabel, ctaUrl);
    }

    await this.prisma.notification.update({
      where: { id: notification.id },
      data: sent ? { emailStatus: 'SENT' } : { emailStatus: 'FAILED', emailError: 'Email provider send failed after retry.' },
    });

    if (!sent) {
      this.logger.warn(`notification.email.failed notificationId=${notification.id}`);
    }
  }
}

/** Never trusts a client-supplied URL (Sprint 11 brief §21 "do not allow arbitrary external URL
 * injection") — `deepLink` always originates from this codebase's own eligibility engines
 * (relative paths only, e.g. `/discover/tarot`), never from user input, and is always joined
 * against the server-configured `appPublicUrl`, never used as a standalone absolute URL. */
function buildDeepLinkUrl(appPublicUrl: string, deepLink: string | null): string {
  if (!deepLink) return appPublicUrl;
  const base = appPublicUrl.endsWith('/') ? appPublicUrl.slice(0, -1) : appPublicUrl;
  const path = deepLink.startsWith('/') ? deepLink : `/${deepLink}`;
  return `${base}${path}`;
}
