'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/cn';
import { premiumApi } from '../api/premium-api';
import { PREMIUM_STATUS_QUERY_KEY } from '../hooks/use-premium-status';

const POLL_INTERVAL_MS = 2000;
// ~60s of polling before switching to reassurance copy — a delayed webhook is not an error, so
// this never turns into a hard failure state, only softer messaging (Phase 11 "payment pending").
const SLOW_POLL_THRESHOLD = 30;

function StateCard({
  icon: Icon,
  tone = 'neutral',
  title,
  description,
  ctaHref,
  ctaLabel,
}: {
  icon: LucideIcon;
  tone?: 'neutral' | 'success' | 'caution';
  title: string;
  description: string;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  return (
    <Card className="mx-auto flex max-w-md flex-col items-center gap-3 py-10 text-center">
      <Icon
        className={cn('h-8 w-8', tone === 'success' && 'text-trust', tone === 'caution' && 'text-caution', tone === 'neutral' && 'text-insight')}
        aria-hidden="true"
      />
      <p className="text-body-lg font-semibold text-text-primary">{title}</p>
      <p className="max-w-sm text-body-sm text-text-secondary">{description}</p>
      {ctaHref && ctaLabel && (
        <Link href={ctaHref}>
          <Button variant="secondary" size="sm">
            {ctaLabel}
          </Button>
        </Link>
      )}
    </Card>
  );
}

/**
 * The post-checkout return page (Phase 11). PayOS's `returnUrl` query param is a UX hint only —
 * this component never treats arriving here as proof of payment. It polls the backend's own
 * `PaymentOrder` status (which only a verified webhook can ever move to PAID) until it settles,
 * then reflects exactly that — nothing here reads or trusts any `?status=success`-style param.
 */
export function PremiumReturnStatus() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order');
  const queryClient = useQueryClient();
  const [pollCount, setPollCount] = useState(0);

  const { data: order, isLoading, isError } = useQuery({
    queryKey: ['payment', 'order', orderId],
    queryFn: () => premiumApi.getOrder(orderId as string),
    enabled: Boolean(orderId),
    refetchInterval: (query) => (query.state.data?.status === 'PENDING' ? POLL_INTERVAL_MS : false),
  });

  useEffect(() => {
    if (order?.status === 'PENDING') setPollCount((count) => count + 1);
  }, [order?.status]);

  useEffect(() => {
    if (order?.status === 'PAID') {
      queryClient.invalidateQueries({ queryKey: PREMIUM_STATUS_QUERY_KEY });
    }
  }, [order?.status, queryClient]);

  if (!orderId) {
    return (
      <StateCard
        icon={XCircle}
        tone="caution"
        title="Missing order"
        description="We couldn't tell which order to check. Head back to Premium to try again."
        ctaHref="/premium"
        ctaLabel="Back to Premium"
      />
    );
  }

  if (isLoading && !order) {
    return <StateCard icon={Clock} title="Checking your payment…" description="Hang tight — this only takes a moment." />;
  }

  if (isError || !order) {
    return (
      <StateCard
        icon={XCircle}
        tone="caution"
        title="Couldn't check your payment"
        description="Something went wrong looking this order up. If you completed payment, it will still activate automatically once confirmed."
        ctaHref="/premium"
        ctaLabel="Back to Premium"
      />
    );
  }

  if (order.status === 'PAID') {
    return (
      <StateCard
        icon={CheckCircle2}
        tone="success"
        title="Premium activated"
        description="Your payment was verified and Premium is now active on your account."
        ctaHref="/discover/tarot"
        ctaLabel="Go to Tarot"
      />
    );
  }

  if (order.status === 'PENDING') {
    const stillWaiting = pollCount >= SLOW_POLL_THRESHOLD;
    return (
      <StateCard
        icon={Clock}
        title={stillWaiting ? 'Still processing' : 'Confirming your payment…'}
        description={
          stillWaiting
            ? "This is taking longer than expected. If you completed payment, it will activate automatically once confirmed — safe to check back later."
            : "We're waiting for your payment provider to confirm this. This page updates automatically."
        }
        ctaHref="/premium"
        ctaLabel="Back to Premium"
      />
    );
  }

  return (
    <StateCard
      icon={XCircle}
      tone="caution"
      title="Payment not completed"
      description="This order didn't go through. No charge was made — you can try again anytime."
      ctaHref="/premium"
      ctaLabel="Try again"
    />
  );
}
