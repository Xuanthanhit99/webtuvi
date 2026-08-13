'use client';

import { useState } from 'react';
import { Bell } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { notificationsApi } from '../api/notifications-api';
import { IconButton } from '@/components/ui/icon-button';
import { Dialog } from '@/components/ui/dialog';
import { NotificationCenter } from './notification-center';

const UNREAD_COUNT_POLL_MS = 60_000;

/**
 * Sprint 11 — the one notification entry point in the authenticated shell (Sprint 11 brief §20:
 * "do not create multiple competing notification entry points"), rendered in `AppHeader` since
 * that's the one element shown on both desktop and mobile (Sidebar/MobileNavigation are
 * breakpoint-exclusive nav lists, not action icons — see
 * docs/architecture/notification-retention.md "Navigation entry").
 *
 * No realtime/WebSocket push (Sprint 11 brief §23 — no reusable realtime infra exists in this
 * codebase; see the architecture doc's "Realtime" section for the full reasoning): the unread
 * count polls on an interval and refetches on window focus (React Query's default), which is
 * enough for a low-frequency, silence-by-default notification volume.
 */
export function NotificationBell() {
  const [open, setOpen] = useState(false);

  const { data } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationsApi.unreadCount(),
    refetchInterval: UNREAD_COUNT_POLL_MS,
  });

  const count = data?.count ?? 0;

  return (
    <>
      <div className="relative">
        <IconButton aria-label={count > 0 ? `Notifications, ${count} unread` : 'Notifications'} onClick={() => setOpen(true)}>
          <Bell className="h-4 w-4" aria-hidden="true" />
        </IconButton>
        {count > 0 && (
          <span
            aria-hidden="true"
            className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-insight px-1 text-[10px] font-medium leading-none text-canvas"
          >
            {count > 9 ? '9+' : count}
          </span>
        )}
      </div>
      <Dialog open={open} onClose={() => setOpen(false)} title="Notifications">
        <NotificationCenter onNavigate={() => setOpen(false)} />
      </Dialog>
    </>
  );
}
