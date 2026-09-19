'use client';

import { useState } from 'react';
import { Mail } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { authApi } from '@/features/auth/api/auth-api';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';

/**
 * Non-blocking by design — never gates access to the app, never redirects.
 * See docs/security/sprint-2a-security.md "Email verification" for why.
 */
export function VerifyEmailBanner() {
  const { user } = useAuth();
  const [sending, setSending] = useState(false);

  if (!user || user.emailVerifiedAt) return null;

  async function handleResend() {
    if (!user) return;
    setSending(true);
    try {
      await authApi.resendVerification(user.email);
      toast.success('Nếu email của bạn cần xác minh, chúng tôi đã gửi một đường liên kết mới.');
    } catch {
      toast.error('Không thể gửi lúc này. Vui lòng thử lại.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      role="status"
      className="flex flex-wrap items-center gap-3 border-b border-border-subtle bg-surface px-4 py-3 text-body-sm text-text-secondary desktop:px-8"
    >
      <Mail className="h-4 w-4 shrink-0 text-insight" aria-hidden="true" />
      <span className="flex-1">Vui lòng xác minh địa chỉ email của bạn để giữ tài khoản an toàn.</span>
      <Button size="sm" variant="secondary" loading={sending} onClick={handleResend}>
        Gửi lại đường liên kết
      </Button>
    </div>
  );
}
