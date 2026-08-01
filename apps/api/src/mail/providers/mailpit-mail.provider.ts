import nodemailer, { Transporter } from 'nodemailer';
import type { MailProvider } from './mail-provider.interface';

/** Local-development SMTP adapter — talks to Mailpit's SMTP listener. */
export class MailpitMailProvider implements MailProvider {
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
