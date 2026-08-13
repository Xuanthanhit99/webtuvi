import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppConfiguration } from '../config/configuration';
import { passwordResetTemplate } from './templates/password-reset.template';
import { welcomeTemplate } from './templates/welcome.template';
import { verifyEmailTemplate } from './templates/verify-email.template';
import { notificationEmailTemplate } from './templates/notification.template';
import type { MailProvider } from './providers/mail-provider.interface';
import { MailpitMailProvider } from './providers/mailpit-mail.provider';
import { ResendMailProvider } from './providers/resend-mail.provider';
import { PostmarkMailProvider } from './providers/postmark-mail.provider';

/**
 * Provider chosen by `EMAIL_PROVIDER` (mailpit | resend | postmark), fully
 * validated at boot by env.validation.ts (production can't select mailpit;
 * resend/postmark require their credential). Swapping providers never
 * requires a code change at any call site — only the env var.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly provider: MailProvider;
  private readonly appUrl: string;

  constructor(private readonly configService: ConfigService) {
    const config = this.configService.get<AppConfiguration>('app')!;
    this.appUrl = config.appPublicUrl;
    this.provider = this.createProvider(config);
  }

  private createProvider(config: AppConfiguration): MailProvider {
    switch (config.mail.provider) {
      case 'resend':
        // env.validation.ts guarantees resendApiKey is set when provider === 'resend'.
        return new ResendMailProvider(config.mail.resendApiKey!, config.mail.from);
      case 'postmark':
        return new PostmarkMailProvider(config.mail.postmarkServerToken!, config.mail.from);
      case 'mailpit':
      default:
        return new MailpitMailProvider(config.mail.mailpitHost, config.mail.mailpitPort, config.mail.from);
    }
  }

  async sendPasswordResetEmail(to: string, resetUrl: string, expiresInLabel: string): Promise<void> {
    const { subject, html, text } = passwordResetTemplate({ resetUrl, expiresInLabel });
    await this.dispatch(to, subject, html, text, 'password reset');
  }

  async sendVerificationEmail(to: string, verifyUrl: string, expiresInLabel: string): Promise<void> {
    const { subject, html, text } = verifyEmailTemplate({ verifyUrl, expiresInLabel });
    await this.dispatch(to, subject, html, text, 'email verification');
  }

  async sendWelcomeEmail(to: string, displayName: string): Promise<void> {
    const { subject, html, text } = welcomeTemplate({ displayName, appUrl: this.appUrl });
    await this.dispatch(to, subject, html, text, 'welcome');
  }

  /** Sprint 11 — unlike the auth-flow senders above (fire-and-forget by design), the caller here
   * (NotificationDeliveryService) needs to know whether the send actually succeeded, so it can
   * persist that as the Notification's own `emailStatus` — this method surfaces `dispatch`'s
   * outcome instead of swallowing it. */
  async sendNotificationEmail(to: string, title: string, body: string, ctaLabel: string, ctaUrl: string): Promise<boolean> {
    const { subject, html, text } = notificationEmailTemplate({ title, body, ctaLabel, ctaUrl });
    return this.dispatch(to, subject, html, text, 'notification');
  }

  /** Returns `true` on a successful send, `false` on failure — never throws. Failure is always
   * logged (without `html`/`text`/token content) so it's observable, but a caller that doesn't
   * care about the outcome (the three auth-flow senders above) can simply not await/use it. */
  private async dispatch(to: string, subject: string, html: string, text: string, label: string): Promise<boolean> {
    try {
      await this.provider.send(to, subject, html, text);
      return true;
    } catch (error) {
      // Never log `html`/`text`/the recipient's token URL — only the failure itself.
      this.logger.error(`Failed to send ${label} email`, error instanceof Error ? error.stack : undefined);
      return false;
    }
  }
}
