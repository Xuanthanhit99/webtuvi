import { welcomeTemplate } from './welcome.template';
import { verifyEmailTemplate } from './verify-email.template';
import { passwordResetTemplate } from './password-reset.template';
import { notificationEmailTemplate } from './notification.template';

describe('transactional email templates — brand + Vietnamese localization', () => {
  it('welcome: uses the Mệnh Vi brand and a Vietnamese subject/body/CTA, never a retired brand', () => {
    const { subject, text, html } = welcomeTemplate({ displayName: 'An', appUrl: 'https://example.test' });
    for (const value of [subject, text, html]) {
      expect(value).not.toMatch(/BeaconVie|Tử Vi Tarot/);
    }
    expect(subject).toMatch(/Mệnh Vi/);
    expect(subject).toMatch(/Chào mừng/);
    expect(html).toContain('Mở Mệnh Vi');
  });

  it('verify-email: uses the Mệnh Vi brand and a Vietnamese subject/body/CTA, never a retired brand', () => {
    const { subject, text, html } = verifyEmailTemplate({ verifyUrl: 'https://example.test/verify', expiresInLabel: '24 giờ' });
    for (const value of [subject, text, html]) {
      expect(value).not.toMatch(/BeaconVie|Tử Vi Tarot/);
    }
    expect(subject).toMatch(/Mệnh Vi/);
    expect(subject).toMatch(/Xác minh/);
    expect(html).toContain('Xác minh email');
  });

  it('password-reset: uses the Mệnh Vi brand and a Vietnamese subject/body/CTA, never a retired brand', () => {
    const { subject, text, html } = passwordResetTemplate({ resetUrl: 'https://example.test/reset', expiresInLabel: '1 giờ' });
    for (const value of [subject, text, html]) {
      expect(value).not.toMatch(/BeaconVie|Tử Vi Tarot/);
    }
    expect(subject).toMatch(/Mệnh Vi/);
    expect(subject).toMatch(/Đặt lại mật khẩu/);
    expect(html).toContain('Đặt lại mật khẩu');
  });

  it('notification: keeps the caller-supplied title/body verbatim but localizes the static footer and never names a retired brand', () => {
    const { text, html } = notificationEmailTemplate({
      title: 'Nhắc nhở ghi nhật ký',
      body: 'Bạn chưa ghi nhật ký hôm nay.',
      ctaLabel: 'Mở nhật ký',
      ctaUrl: 'https://example.test/journal',
    });
    for (const value of [text, html]) {
      expect(value).not.toMatch(/BeaconVie|Tử Vi Tarot/);
    }
    expect(text).toMatch(/Quản lý các email Mệnh Vi/);
    expect(html).toContain('Cài đặt &gt; Thông báo');
  });
});
