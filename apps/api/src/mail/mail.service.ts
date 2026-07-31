import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';
import type { AppConfiguration } from '../config/configuration';
import { passwordResetTemplate } from './templates/password-reset.template';
import { welcomeTemplate } from './templates/welcome.template';

/**
 * Thin provider abstraction: Sprint 1 ships a Mailpit (SMTP) provider for local
 * development. Swapping in a production provider (Resend, Postmark, ...) later
 * only requires a new class implementing `send`, wired in the constructor below.
 */
interface MailProvider {
  send(to: string, subject: string, html: string, text: string): Promise<void>;
}

class MailpitProvider implements MailProvider {
  private readonly transporter: Transporter;

  constructor(
    private readonly host: string,
    private readonly port: number,
    private readonly from: string,
  ) {
    this.transporter = nodemailer.createTransport({ host, port, secure: false });
  }

  async send(to: string, subject: string, html: string, text: string): Promise<void> {
    await this.transporter.sendMail({ from: this.from, to, subject, html, text });
  }
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly provider: MailProvider;
  private readonly appUrl: string;

  constructor(private readonly configService: ConfigService) {
    const config = this.configService.get<AppConfiguration>('app')!;
    this.appUrl = config.frontendUrl;
    this.provider = new MailpitProvider(config.mail.mailpitHost, config.mail.mailpitPort, config.mail.from);
  }

  async sendPasswordResetEmail(to: string, resetUrl: string, expiresInLabel: string): Promise<void> {
    const { subject, html, text } = passwordResetTemplate({ resetUrl, expiresInLabel });
    try {
      await this.provider.send(to, subject, html, text);
    } catch (error) {
      this.logger.error('Failed to send password reset email', error instanceof Error ? error.stack : undefined);
    }
  }

  async sendWelcomeEmail(to: string, displayName: string): Promise<void> {
    const { subject, html, text } = welcomeTemplate({ displayName, appUrl: this.appUrl });
    try {
      await this.provider.send(to, subject, html, text);
    } catch (error) {
      this.logger.error('Failed to send welcome email', error instanceof Error ? error.stack : undefined);
    }
  }
}
