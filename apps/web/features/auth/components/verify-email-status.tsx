'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { authApi } from '../api/auth-api';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api-error';

type Status = 'loading' | 'success' | 'expired' | 'invalid' | 'network-error' | 'missing-token' | 'rate-limited';

function statusFromError(error: unknown): Status {
  if (error instanceof ApiError) {
    if (error.status === 429) return 'rate-limited';
    if (error.code === 'VERIFICATION_TOKEN_EXPIRED') return 'expired';
    if (error.code === 'VERIFICATION_TOKEN_INVALID') return 'invalid';
  }
  return 'network-error';
}

/**
 * Non-blocking by design (docs/security/sprint-2a-security.md): this page
 * never redirect-loops the user, and every outcome renders real page content
 * (not just a toast), per the "no toast-only content" requirement.
 */
export function VerifyEmailStatus() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<Status>(token ? 'loading' : 'missing-token');
  const attempted = useRef(false);

  useEffect(() => {
    if (!token || attempted.current) return;
    attempted.current = true;

    authApi
      .verifyEmail(token)
      .then(() => setStatus('success'))
      .catch((error) => setStatus(statusFromError(error)));
  }, [token]);

  if (status === 'missing-token') {
    return (
      <Alert variant="error" title="Thiếu liên kết xác minh">
        Mở liên kết xác minh trong email, hoặc{' '}
        <Link href="/verify-email/pending" className="font-semibold underline">
          yêu cầu liên kết mới
        </Link>
        .
      </Alert>
    );
  }

  if (status === 'rate-limited') return <Alert variant="error" title="Vui lòng thử lại sau">Bạn đã thử quá nhiều lần. Hãy đợi một lát rồi mở lại liên kết xác minh trong email.</Alert>;

  if (status === 'loading') {
    return (
      <div className="flex items-center gap-3 text-body-md text-text-secondary" role="status">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
        Đang xác minh email…
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col gap-4">
        <Alert variant="success" title="Đã xác minh email">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            Địa chỉ email của bạn đã được xác nhận.
          </span>
        </Alert>
        <Button onClick={() => router.push('/')} fullWidth>
          Tiếp tục khám phá
        </Button>
      </div>
    );
  }

  if (status === 'expired') {
    return (
      <div className="flex flex-col gap-4">
        <Alert variant="error" title="Liên kết đã hết hạn">
          Hãy yêu cầu liên kết mới để xác minh email.
        </Alert>
        <Button onClick={() => router.push('/verify-email/pending')} fullWidth>
          Gửi liên kết mới
        </Button>
      </div>
    );
  }

  if (status === 'invalid') {
    return (
      <div className="flex flex-col gap-4">
        <Alert variant="error" title="Liên kết không hợp lệ">
          Liên kết có thể đã được sử dụng hoặc sao chép chưa đầy đủ.
        </Alert>
        <Button onClick={() => router.push('/verify-email/pending')} fullWidth>
          Gửi liên kết mới
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Alert
        variant="error"
        title="Chưa thể xác minh"
        action={
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              attempted.current = false;
              setStatus('loading');
              if (token) {
                authApi
                  .verifyEmail(token)
                  .then(() => setStatus('success'))
                  .catch((error) => setStatus(statusFromError(error)));
              }
            }}
          >
            Thử lại
          </Button>
        }
      >
        Chưa thể kết nối máy chủ. Hãy kiểm tra mạng và thử lại.
      </Alert>
    </div>
  );
}
