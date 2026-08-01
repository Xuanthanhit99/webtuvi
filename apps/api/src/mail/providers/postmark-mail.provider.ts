import type { MailProvider } from './mail-provider.interface';

const POSTMARK_API_URL = 'https://api.postmarkapp.com/email';

/** Production adapter for the Postmark transactional email API (plain `fetch`, no SDK dependency). */
export class PostmarkMailProvider implements MailProvider {
  constructor(
    private readonly serverToken: string,
    private readonly from: string,
  ) {}

  async send(to: string, subject: string, html: string, text: string): Promise<void> {
    const response = await fetch(POSTMARK_API_URL, {
      method: 'POST',
      headers: {
        'X-Postmark-Server-Token': this.serverToken,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        From: this.from,
        To: to,
        Subject: subject,
        HtmlBody: html,
        TextBody: text,
        MessageStream: 'outbound',
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`Postmark API request failed (${response.status}): ${body.slice(0, 300)}`);
    }
  }
}
