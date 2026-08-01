'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { authApi } from '../api/auth-api';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api-error';

type Status = 'loading' | 'success' | 'expired' | 'invalid' | 'network-error' | 'missing-token';

function statusFromError(error: unknown): Status {
  if (error instanceof ApiError) {
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
      <Alert variant="error" title="Missing verification link">
        This page needs a verification link from your email. Check your inbox, or{' '}
        <Link href="/verify-email/pending" className="font-semibold underline">
          request a new link
        </Link>
        .
      </Alert>
    );
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center gap-3 text-body-md text-text-secondary" role="status">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
        Verifying your email…
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col gap-4">
        <Alert variant="success" title="Email verified">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            Your email address is confirmed.
          </span>
        </Alert>
        <Button onClick={() => router.push('/dashboard')} fullWidth>
          Continue to your Dashboard
        </Button>
      </div>
    );
  }

  if (status === 'expired') {
    return (
      <div className="flex flex-col gap-4">
        <Alert variant="error" title="This link has expired">
          Verification links expire after a while for your security.
        </Alert>
        <Button onClick={() => router.push('/verify-email/pending')} fullWidth>
          Send a new link
        </Button>
      </div>
    );
  }

  if (status === 'invalid') {
    return (
      <div className="flex flex-col gap-4">
        <Alert variant="error" title="This link isn’t valid">
          It may have already been used, or the link was copied incorrectly.
        </Alert>
        <Button onClick={() => router.push('/verify-email/pending')} fullWidth>
          Send a new link
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Alert
        variant="error"
        title="Something went wrong"
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
            Try again
          </Button>
        }
      >
        We couldn’t reach the server. Check your connection and try again.
      </Alert>
    </div>
  );
}
