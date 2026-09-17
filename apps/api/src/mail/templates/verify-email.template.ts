export interface VerifyEmailTemplateInput {
  verifyUrl: string;
  expiresInLabel: string;
}

export function verifyEmailTemplate({ verifyUrl, expiresInLabel }: VerifyEmailTemplateInput) {
  const subject = 'Xác minh email Mệnh Vi của bạn';

  const text = [
    'Vui lòng xác nhận đây là địa chỉ email của bạn.',
    `Xác minh email: ${verifyUrl}`,
    `Đường liên kết này hết hạn sau ${expiresInLabel}.`,
    'Nếu bạn không tạo tài khoản Mệnh Vi, bạn có thể bỏ qua email này.',
  ].join('\n\n');

  const html = `<!doctype html>
<html lang="vi">
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
                <p style="color:#E3B368;font-size:14px;letter-spacing:0.04em;text-transform:uppercase;margin:0 0 24px;">Mệnh Vi</p>
                <h1 style="color:#F1ECE4;font-size:22px;line-height:1.3;margin:0 0 16px;">Xác minh email của bạn</h1>
                <p style="color:#B7AFC9;font-size:16px;line-height:1.5;margin:0 0 24px;">
                  Vui lòng xác nhận đây là địa chỉ email của bạn để chúng tôi giữ tài khoản của bạn an toàn.
                </p>
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="border-radius:12px;background-color:#E3B368;">
                      <a href="${verifyUrl}" style="display:inline-block;padding:12px 24px;color:#161428;font-weight:600;text-decoration:none;font-size:16px;border-radius:12px;">
                        Xác minh email
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="color:#B7AFC9;font-size:14px;line-height:1.5;margin:24px 0 0;">
                  Đường liên kết này hết hạn sau ${expiresInLabel}. Nếu bạn không tạo tài khoản Mệnh Vi, bạn có thể bỏ qua email này.
                </p>
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
