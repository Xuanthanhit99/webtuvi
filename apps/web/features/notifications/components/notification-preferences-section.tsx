'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { NotificationPreferencesDto } from '@beaconvie/types';
import { notificationsApi } from '../api/notifications-api';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/toast';
import { ErrorState } from '@/components/ui/error-state';

/**
 * Sprint 11 — replaces Settings' former "Notifications and theme are coming soon" line
 * (`apps/web/app/(app)/settings/page.tsx`) with real, working controls. Deliberately does not
 * expose internal enum/category terminology (Sprint 11 brief §22) or a "Product updates" toggle
 * with nothing behind it yet (see docs/architecture/notification-retention.md "Sở thích" for
 * why `NotificationPreference` only has two real fields today). Account/payment notices are
 * described here, not toggled — see the doc comment below for why that's not an oversight.
 */
export function NotificationPreferencesSection() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({
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
      toast.success('Đã lưu tùy chọn.');
    },
    onError: (_error, _patch, context) => {
      if (context?.previous) queryClient.setQueryData(['notifications', 'preferences'], context.previous);
      toast.error('Chưa thể lưu thay đổi. Vui lòng thử lại.');
    },
  });

  return (
    <Card className="flex flex-col gap-4">
      <div>
        <p className="mb-1 text-body-sm font-semibold text-text-secondary">Thông báo</p>
        <p className="text-body-sm text-text-secondary">
          Chọn cách nhận nhắc nhở từ Mệnh Vi.
        </p>
      </div>

      <div className="flex flex-col gap-3 border-t border-border-subtle pt-4">
        {isError ? <ErrorState title="Chưa thể tải tùy chọn thông báo" onRetry={() => refetch()} /> : isLoading || !data ? (
          <Skeleton className="h-11 w-full" />
        ) : (
          <>
            <Checkbox
              id="reminder-in-app"
              checked={data.reminderInApp}
              disabled={update.isPending}
              onChange={(e) => update.mutate({ reminderInApp: e.target.checked })}
              label={
                <span>
                  <span className="font-medium text-text-primary">Nhận nhắc nhở trong ứng dụng</span>
                  <br />
                  Nhắc nhở về nội dung dành cho bạn. Tắt tùy chọn này cũng tắt email nhắc nhở bên dưới.
                </span>
              }
            />
            <Checkbox
              id="reminder-email"
              checked={data.reminderEmail}
              disabled={!data.reminderInApp || update.isPending}
              onChange={(e) => update.mutate({ reminderEmail: e.target.checked })}
              label={
                <span>
                  <span className="font-medium text-text-primary">Nhận thêm nhắc nhở qua email</span>
                  <br />
                  Mặc định tắt. Chỉ gửi thêm email khi bạn bật tùy chọn này.
                </span>
              }
            />
          </>
        )}

        <p className="border-t border-border-subtle pt-3 text-body-sm text-text-secondary">
          Thông báo về tài khoản và thanh toán Premium luôn xuất hiện trong mục Thông báo để bạn theo dõi hoạt động tài khoản.
        </p>
      </div>
    </Card>
  );
}
