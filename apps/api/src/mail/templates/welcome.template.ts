export interface WelcomeTemplateInput {
  displayName: string;
  appUrl: string;
}

export function welcomeTemplate({ displayName, appUrl }: WelcomeTemplateInput) {
  const subject = 'Welcome to Tử Vi Tarot';

  const text = [
    `Hi ${displayName},`,
    'Your Tử Vi Tarot account is ready.',
    `Continue here: ${appUrl}`,
  ].join('\n\n');

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${subject}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#161428;font-family:Karla,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#161428;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:480px;background-color:#1F1C36;border-radius:20px;padding:32px;" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <p style="color:#E3B368;font-size:14px;letter-spacing:0.04em;text-transform:uppercase;margin:0 0 24px;">Tử Vi Tarot</p>
                <h1 style="color:#F1ECE4;font-size:22px;line-height:1.3;margin:0 0 16px;">Hi ${displayName},</h1>
                <p style="color:#B7AFC9;font-size:16px;line-height:1.5;margin:0 0 24px;">
                  Your account is ready. Come back whenever you'd like to continue the conversation.
                </p>
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="border-radius:12px;background-color:#E3B368;">
                      <a href="${appUrl}" style="display:inline-block;padding:12px 24px;color:#161428;font-weight:600;text-decoration:none;font-size:16px;border-radius:12px;">
                        Open Tử Vi Tarot
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, text, html };
}
