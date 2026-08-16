'use client';

import { useMutation } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError } from '@/lib/api-error';
import { premiumApi } from '../api/premium-api';
import { usePremiumStatus } from '../hooks/use-premium-status';
import { PremiumMatrix } from './premium-matrix';

function checkoutErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === 'PAYMENT_PROVIDER_UNAVAILABLE' || error.code === 'PAYMENTS_DISABLED') {
      return 'Payment is temporarily unavailable. Please try again in a little while.';
    }
    if (error.code === 'RATE_LIMITED') {
      return "You've tried a few times quickly — please wait a moment and try again.";
    }
    return error.message;
  }
  return "Couldn't start checkout. Please try again.";
}

/**
 * The core of `/premium` (Phase 11). Never claims payment succeeded on its own — a successful
 * checkout only redirects the browser to PayOS's hosted page; the actual "Premium activated" state
 * is only ever shown once `/premium/return` (or this page, on next load) reads it back from
 * `GET /payment/premium-status`, which is itself only ever written by a verified webhook.
 */
export function PremiumUpgradePanel() {
  const { data: status, isLoading, isError, refetch } = usePremiumStatus();

  const checkout = useMutation({
    mutationFn: () => premiumApi.checkout(),
    onSuccess: (order) => {
      if (order.checkoutUrl) {
        window.location.href = order.checkoutUrl;
      }
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (isError || !status) {
    return (
      <div role="alert" className="rounded-lg border border-caution/30 bg-caution/5 p-6 text-center">
        <p className="text-body-md font-medium text-text-primary">Couldn&rsquo;t load your Premium status</p>
        <p className="mt-1 text-body-sm text-text-secondary">Please try again.</p>
        <Button variant="secondary" size="sm" className="mt-4" onClick={() => refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  if (status.isPremium) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-center gap-2 rounded-lg border border-insight/30 bg-insight/5 px-6 py-10 text-center">
          <Sparkles className="h-8 w-8 text-insight" aria-hidden="true" />
          <div className="flex items-center gap-2">
            <p className="text-body-lg font-semibold text-text-primary">You&rsquo;re Premium</p>
            <Badge variant="insight">Active</Badge>
          </div>
          {status.expiresAt && (
            <p className="text-body-sm text-text-secondary">Active until {new Date(status.expiresAt).toLocaleDateString()}.</p>
          )}
        </div>
        <PremiumMatrix />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-3 rounded-lg border border-border-subtle bg-surface px-6 py-10 text-center">
        <Sparkles className="h-8 w-8 text-insight" aria-hidden="true" />
        <p className="text-body-lg font-semibold text-text-primary">Upgrade to Premium</p>
        <p className="max-w-md text-body-sm text-text-secondary">
          Higher daily Tarot allowances, deeper AI interpretations, and unlimited reading history — a one-time 30-day
          Premium pass.
        </p>
        <p className="text-heading-md font-display text-text-primary">
          {status.priceVnd.toLocaleString('vi-VN')} {status.currency}
          <span className="ml-1 text-body-sm font-normal text-text-secondary">/ 30 days</span>
        </p>
        {status.isMvpTestPrice && (
          <p className="text-caption text-text-disabled">MVP test price — not yet finalized.</p>
        )}
        {status.paymentsEnabled ? (
          <>
            <Button variant="primary" onClick={() => checkout.mutate()} loading={checkout.isPending}>
              Upgrade to Premium
            </Button>
            {checkout.isError && (
              <p role="alert" className="text-body-sm text-caution">
                {checkoutErrorMessage(checkout.error)}
              </p>
            )}
            <p className="text-caption text-text-disabled">You&rsquo;ll pay securely on PayOS&rsquo;s hosted checkout page.</p>
          </>
        ) : (
          // Sprint 12 — mirrors the backend PAYMENTS_ENABLED kill switch honestly upfront, rather
          // than letting the user click through to a checkout attempt that would only fail after
          // the fact with PAYMENTS_DISABLED (see docs/progress/payos-production-readiness.md
          // "Payment kill switch"). Backend remains the actual enforcement point either way.
          <p role="status" className="text-body-sm text-text-secondary">
            Upgrades are temporarily unavailable. Please check back soon.
          </p>
        )}
      </div>
      <PremiumMatrix />
    </div>
  );
}
