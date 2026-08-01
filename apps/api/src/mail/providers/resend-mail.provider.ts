import type { MailProvider } from './mail-provider.interface';

const RESEND_API_URL = 'https://api.resend.com/emails';

/** Production adapter for the Resend transactional email API (plain `fetch`, no SDK dependency). */
export class ResendMailProvider implements MailProvider {
  constructor(
    private readonly apiKey: string,
    private readonly from: string,
  ) {}

  async send(to: string, subject: string, html: string, text: string): Promise<void> {
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: this.from, to, subject, html, text }),
    });

    if (!response.ok) {
      // Never include the email body (may contain a verification/reset token
      // URL) in the thrown error — only the provider's own response.
      const body = await response.text().catch(() => '');
      throw new Error(`Resend API request failed (${response.status}): ${body.slice(0, 300)}`);
    }
  }
}
