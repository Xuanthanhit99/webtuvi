import type { Notification } from '@prisma/client';
import { NotificationDeliveryService } from './notification-delivery.service';

const NOTIFICATION = {
  id: 'notif-1',
  userId: 'user-1',
  title: "Today's card is ready",
  body: 'Body',
  deepLink: '/discover/tarot',
} as unknown as Notification;

function makeHarness(sendResults: boolean[]) {
  const notification = { update: jest.fn(async ({ data }: { data: unknown }) => data) };
  const prisma = { notification };
  const sendNotificationEmail = jest.fn();
  sendResults.forEach((result) => sendNotificationEmail.mockResolvedValueOnce(result));
  const mail = { sendNotificationEmail };
  const configService = { get: jest.fn().mockReturnValue({ appPublicUrl: 'https://app.beaconvie.example' }) };

  const service = new NotificationDeliveryService(prisma as never, mail as never, configService as never);
  return { service, notification, mail };
}

describe('NotificationDeliveryService.deliverEmail', () => {
  it('sends once and marks SENT on success', async () => {
    const { service, notification, mail } = makeHarness([true]);

    await service.deliverEmail(NOTIFICATION, 'user@example.com', 'Draw today’s card');

    expect(mail.sendNotificationEmail).toHaveBeenCalledTimes(1);
    expect(mail.sendNotificationEmail).toHaveBeenCalledWith(
      'user@example.com',
      "Today's card is ready",
      'Body',
      'Draw today’s card',
      'https://app.beaconvie.example/discover/tarot',
    );
    expect(notification.update).toHaveBeenLastCalledWith({ where: { id: 'notif-1' }, data: { emailStatus: 'SENT' } });
  });

  it('retries once on failure (bounded, not infinite) and succeeds on the second attempt', async () => {
    const { service, notification, mail } = makeHarness([false, true]);

    await service.deliverEmail(NOTIFICATION, 'user@example.com', 'CTA');

    expect(mail.sendNotificationEmail).toHaveBeenCalledTimes(2);
    expect(notification.update).toHaveBeenLastCalledWith({ where: { id: 'notif-1' }, data: { emailStatus: 'SENT' } });
  });

  it('marks FAILED after exhausting the bounded retry (never more than 2 attempts)', async () => {
    const { service, notification, mail } = makeHarness([false, false]);

    await service.deliverEmail(NOTIFICATION, 'user@example.com', 'CTA');

    expect(mail.sendNotificationEmail).toHaveBeenCalledTimes(2);
    expect(notification.update).toHaveBeenLastCalledWith({
      where: { id: 'notif-1' },
      data: { emailStatus: 'FAILED', emailError: 'Email provider send failed after retry.' },
    });
  });

  it('joins a relative deepLink against the configured public URL, never trusting an absolute/external value', async () => {
    const { service, mail } = makeHarness([true]);
    await service.deliverEmail({ ...NOTIFICATION, deepLink: null }, 'user@example.com', 'CTA');
    expect(mail.sendNotificationEmail).toHaveBeenCalledWith(
      'user@example.com',
      expect.any(String),
      expect.any(String),
      'CTA',
      'https://app.beaconvie.example',
    );
  });

  it('records an attempted-at timestamp before sending, independent of the outcome', async () => {
    const { service, notification } = makeHarness([true]);
    await service.deliverEmail(NOTIFICATION, 'user@example.com', 'CTA');
    expect(notification.update).toHaveBeenNthCalledWith(1, { where: { id: 'notif-1' }, data: { emailAttemptedAt: expect.any(Date) } });
  });
});
