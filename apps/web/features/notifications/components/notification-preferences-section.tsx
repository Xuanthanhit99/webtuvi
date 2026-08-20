'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { NotificationPreferencesDto } from '@beaconvie/types';
import { notificationsApi } from '../api/notifications-api';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/toast';

/**
 * Sprint 11 — replaces Settings' former "Notifications and theme are coming soon" line
 * (`apps/web/app/(app)/settings/page.tsx`) with real, working controls. Deliberately does not
 * expose internal enum/category terminology (Sprint 11 brief §22) or a "Product updates" toggle
 * with nothing behind it yet (see docs/architecture/notification-retention.md "Preferences" for
 * why `NotificationPreference` only has two real fields today). Account/payment notices are
 * described here, not toggled — see the doc comment below for why that's not an oversight.
 */
export function NotificationPreferencesSection() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['notifications', 'preferences'],
    queryFn: () => notificationsApi.getPreferences(),
  });

  const update = useMutation({
    mutationFn: (patch: Partial<NotificationPreferencesDto>) => notificationsApi.updatePreferences(patch),
    // Release Closure finding: without an optimistic update, this controlled checkbox visually
    // "snapped back" to its pre-click state for the duration of the network round-trip (the
    // component re-renders from the still-stale query cache before `onSuccess` ever fires),
    // which read as an unresponsive/broken control — reproduced live via Playwright
    // (`Clicking the checkbox did not change its state`), not merely a test-timing artifact.
    // Standard React Query optimistic-update pattern: apply immediately, roll back on failure.
    onMutate: async (patch) => {
      await queryClient.cancelQueries({ queryKey: ['notifications', 'preferences'] });
      const previous = queryClient.getQueryData<NotificationPreferencesDto>(['notifications', 'preferences']);
      if (previous) queryClient.setQueryData(['notifications', 'preferences'], { ...previous, ...patch });
      return { previous };
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(['notifications', 'preferences'], updated);
      toast.success('Preference updated.');
    },
    onError: (_error, _patch, context) => {
      if (context?.previous) queryClient.setQueryData(['notifications', 'preferences'], context.previous);
      toast.error("Couldn't save that. Please try again.");
    },
  });

  return (
    <Card className="flex flex-col gap-4">
      <div>
        <p className="mb-1 text-body-sm font-semibold text-text-secondary">Notifications</p>
        <p className="text-body-sm text-text-secondary">
          Tử Vi Tarot only notifies you when there&rsquo;s a genuine reason to — silence is the expected default, not a
          missed opportunity. Theme preferences are still coming soon.
        </p>
      </div>

      <div className="flex flex-col gap-3 border-t border-border-subtle pt-4">
        {isLoading || !data ? (
          <Skeleton className="h-11 w-full" />
        ) : (
          <>
            <Checkbox
              id="reminder-in-app"
              checked={data.reminderInApp}
              onChange={(e) => update.mutate({ reminderInApp: e.target.checked })}
              label={
                <span>
                  <span className="font-medium text-text-primary">Show reminders in Notifications</span>
                  <br />
                  Occasional, specific reminders — like a Daily Tarot card still waiting for you. Turning this off
                  also turns off reminder emails below.
                </span>
              }
            />
            <Checkbox
              id="reminder-email"
              checked={data.reminderEmail}
              disabled={!data.reminderInApp}
              onChange={(e) => update.mutate({ reminderEmail: e.target.checked })}
              label={
                <span>
                  <span className="font-medium text-text-primary">Also email me reminders</span>
                  <br />
                  Off by default — reminders stay in-app only unless you turn this on.
                </span>
              }
            />
          </>
        )}

        <p className="border-t border-border-subtle pt-3 text-body-sm text-text-secondary">
          Account and Premium payment notices (like a successful activation) are always shown in your Notifications —
          these aren&rsquo;t optional, since they&rsquo;re how we tell you about your own account.
        </p>
      </div>
    </Card>
  );
}
