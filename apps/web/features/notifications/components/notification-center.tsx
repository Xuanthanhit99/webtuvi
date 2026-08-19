'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { NotificationDto } from '@beaconvie/types';
import { notificationsApi } from '../api/notifications-api';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/toast';
import { trackEvent } from '@/lib/analytics';

/** Sprint 11 Release Closure — defense-in-depth: `deepLink` is always server-generated today (no
 * client-facing create endpoint exists for it — see notifications.controller.ts), so this is not
 * exploitable in the current codebase, but a future notification type must not be able to smuggle
 * an external redirect or a `javascript:`/`data:` URL through this component. Requires a single
 * leading `/` (same-origin relative path) and rejects a second leading `/` (protocol-relative,
 * e.g. `//evil.example`) and any `:` (blocks `javascript:`, `data:`, `https:` absolute URLs). */
function isSafeDeepLink(link: string): boolean {
  return link.startsWith('/') && !link.startsWith('//') && !link.includes(':');
}

const CATEGORY_BADGE_LABEL: Record<NotificationDto['category'], string> = {
  SECURITY: 'Security',
  PREMIUM: 'Premium',
  DISCOVERY: 'Discovery',
};

/**
 * Sprint 11 — the actual Notification Center content, rendered inside the shared `Dialog`
 * primitive by `NotificationBell` (no bespoke popover/positioning code — see
 * docs/architecture/notification-retention.md "Frontend" for why a modal, not a dropdown, was the
 * reuse-first choice here). Chronological list, no unread-count red-badge urgency styling beyond
 * the bell's own count (Product Bible Module 19 §5/§21's explicit "no anxiety-driven badge"
 * standard is about the *count* affordance, not about hiding read state entirely inside the list
 * itself, where a quiet dot is enough to distinguish read/unread).
 */
export function NotificationCenter({ onNavigate }: { onNavigate: () => void }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['notifications', 'list'],
    queryFn: () => notificationsApi.list({ pageSize: 20 }),
  });

  const markRead = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllRead = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('All caught up.');
    },
    onError: () => toast.error("Couldn't mark everything read. Please try again."),
  });

  function handleOpen(notification: NotificationDto) {
    if (!notification.read) markRead.mutate(notification.id);
    trackEvent('notification_opened', { feature: 'notifications', notificationCategory: notification.category });
    onNavigate();
    if (notification.deepLink && isSafeDeepLink(notification.deepLink)) router.push(notification.deepLink);
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState description="Couldn't load your notifications." onRetry={() => refetch()} />;
  }

  const items = data?.items ?? [];

  if (items.length === 0) {
    return <EmptyState title="Nothing new" description="You're all caught up — this is the expected, healthy state." />;
  }

  const hasUnread = items.some((n) => !n.read);

  return (
    <div className="flex flex-col gap-3">
      {hasUnread && (
        <div className="flex justify-end">
          <Button variant="secondary" size="sm" onClick={() => markAllRead.mutate()} loading={markAllRead.isPending}>
            Mark all read
          </Button>
        </div>
      )}
      <ul className="flex flex-col divide-y divide-border-subtle">
        {items.map((notification) => (
          <li key={notification.id}>
            <button
              type="button"
              onClick={() => handleOpen(notification)}
              className="flex w-full flex-col gap-1 py-3 text-left hover:bg-surface"
            >
              <div className="flex items-center gap-2">
                {!notification.read && (
                  <>
                    <span className="h-2 w-2 shrink-0 rounded-full bg-insight" aria-hidden="true" />
                    {/* Accessibility + Product Polish (2026-08-19): the dot above is aria-hidden,
                        so unread state previously had no screen-reader-facing signal at all inside
                        the list (the bell's own aggregate "N unread" count is separate and already
                        correct). Read items get no extra text — only unread ones announce it. */}
                    <span className="sr-only">Unread</span>
                  </>
                )}
                <span className="text-body-sm font-medium text-text-primary">{notification.title}</span>
                <Badge variant="neutral" className="ml-auto shrink-0">
                  {CATEGORY_BADGE_LABEL[notification.category]}
                </Badge>
              </div>
              <p className="text-body-sm text-text-secondary">{notification.body}</p>
              <span className="text-caption text-text-tertiary">{new Date(notification.createdAt).toLocaleDateString()}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
