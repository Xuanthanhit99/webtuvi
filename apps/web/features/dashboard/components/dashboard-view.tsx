'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/dashboard-api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { PremiumStatusCard } from '@/features/premium/components/premium-status-card';

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function DashboardView() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardApi.get,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return <ErrorState description="We couldn't load your dashboard." onRetry={() => refetch()} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="hero-heading">
        <h1 id="hero-heading" className="font-display text-heading-lg text-text-primary">
          {data.hero.greeting}
        </h1>
        <p className="mt-2 text-body-md text-text-secondary">{data.hero.subheadline}</p>
        <Link
          href={data.hero.ctaHref}
          className="mt-4 inline-flex h-11 items-center justify-center rounded-md bg-insight px-4 text-body-sm font-semibold text-canvas hover:bg-[#E2C27C] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-insight"
        >
          {data.hero.ctaLabel}
        </Link>
      </section>

      {data.discoverySuggestion && (
        <Link href={data.discoverySuggestion.href} className="block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-insight">
          <Card className="transition-colors hover:border-insight/50">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-body-sm font-semibold text-text-secondary">Discover</p>
              {data.discoverySuggestion.comingSoon && <Badge>Coming soon</Badge>}
            </div>
            <p className="text-body-md text-text-primary">{data.discoverySuggestion.title}</p>
            <p className="mt-1 text-body-sm text-text-secondary">{data.discoverySuggestion.description}</p>
          </Card>
        </Link>
      )}

      <Card>
        <p className="mb-3 text-body-sm font-semibold text-text-secondary">From your Companion</p>
        {data.companionPanel.previewMessages.length === 0 ? (
          <p className="text-body-md text-text-primary">
            I&rsquo;m here whenever you&rsquo;re ready. We can start with something small.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {data.companionPanel.previewMessages.map((m) => (
              <p key={m.id} className="text-body-sm text-text-secondary">
                <span className="font-medium text-text-primary">{m.role === 'companion' ? 'Companion' : 'You'}:</span>{' '}
                {m.content}
              </p>
            ))}
          </div>
        )}
        {data.companionPanel.suggestionChip && (
          <Badge variant="insight" className="mt-3">
            {data.companionPanel.suggestionChip}
          </Badge>
        )}
        <Link href="/companion" className="mt-4 block text-body-sm text-insight underline">
          Start a conversation
        </Link>
      </Card>

      {data.recentActivity.length > 0 && (
        <Card>
          <p className="mb-3 text-body-sm font-semibold text-text-secondary">Recent activity</p>
          <ul className="flex flex-col gap-2">
            {data.recentActivity.map((activity, i) => (
              <li key={i} className="flex justify-between text-body-sm text-text-secondary">
                <span>{activity.label}</span>
                <span className="text-text-tertiary">{timeAgo(activity.createdAt)}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Link href="/memory" className="block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-insight">
        <Card className="transition-colors hover:border-insight/50">
          <p className="mb-2 text-body-sm font-semibold text-text-secondary">Memory</p>
          {data.memoryHighlight ? (
            <p className="text-body-md text-text-primary">
              {data.memoryHighlight.content.replace(/^Remembered:\s*/, '')}
            </p>
          ) : (
            <>
              <p className="text-body-md text-text-primary">No memories yet.</p>
              <p className="mt-1 text-body-sm text-text-secondary">
                Memories you choose to save will appear here.
              </p>
            </>
          )}
        </Card>
      </Link>

      <Card>
        <PremiumStatusCard />
      </Card>
    </div>
  );
}
