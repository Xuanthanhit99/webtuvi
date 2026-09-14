'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LogOut, Monitor, ShieldAlert } from 'lucide-react';
import type { SessionDto } from '@beaconvie/types';
import { authApi } from '@/features/auth/api/auth-api';
import { useInvalidateAuth } from '@/providers/auth-provider';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
import { Dialog } from '@/components/ui/dialog';
import { toast } from '@/components/ui/toast';

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function SessionsPanel() {
  const queryClient = useQueryClient();
  const invalidateAuth = useInvalidateAuth();
  const router = useRouter();
  const [pendingRevoke, setPendingRevoke] = useState<SessionDto | null>(null);
  const [confirmLogoutAll, setConfirmLogoutAll] = useState(false);

  const { data: sessions, isLoading, isError, refetch } = useQuery({
    queryKey: ['sessions'],
    queryFn: authApi.sessions,
  });

  const revokeMutation = useMutation({
    mutationFn: (session: SessionDto) => authApi.revokeSession(session.id),
    onSuccess: async (_data, session) => {
      setPendingRevoke(null);
      if (session.current) {
        await invalidateAuth(true);
        toast.success("Đã đăng xuất khỏi thiết bị này.");
        router.push('/login');
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      toast.success('Đã đăng xuất thiết bị đã chọn.');
    },
    onError: () => {
      setPendingRevoke(null);
      toast.error("Chưa thể đăng xuất thiết bị này. Vui lòng thử lại.");
    },
  });

  const logoutAllMutation = useMutation({
    mutationFn: authApi.logoutAll,
    onSuccess: async () => {
      setConfirmLogoutAll(false);
      await invalidateAuth(true);
      toast.success("Đã đăng xuất mọi thiết bị.");
      router.push('/login');
    },
    onError: () => {
      setConfirmLogoutAll(false);
      toast.error("Chưa thể đăng xuất mọi thiết bị. Vui lòng thử lại.");
    },
  });

  return (
    <Card>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-body-sm font-semibold text-text-secondary">Thiết bị đang đăng nhập</p>
        {sessions && sessions.length > 0 && (
          <Button
            variant="danger"
            size="sm"
            onClick={() => setConfirmLogoutAll(true)}
            loading={logoutAllMutation.isPending}
          >
            Đăng xuất tất cả
          </Button>
        )}
      </div>

      {isLoading && (
        // Accessibility + Product Polish (2026-08-19): Skeleton itself is aria-hidden (correct —
        // it shouldn't be read literally); this sr-only status text is the announcement it needs,
        // matching the role="status" pattern already used elsewhere (verify-email-status.tsx etc).
        <div className="flex flex-col gap-2" role="status">
          <span className="sr-only">Đang tải danh sách thiết bị…</span>
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      )}

      {isError && !isLoading && (
        <ErrorState
          title="Chưa thể tải danh sách thiết bị"
          description="Vui lòng thử lại."
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !isError && sessions && sessions.length === 0 && (
        <EmptyState title="Không có phiên đăng nhập" description="Hiện không có thiết bị nào đang đăng nhập." />
      )}

      {!isLoading && !isError && sessions && sessions.length > 0 && (
        <ul className="flex flex-col gap-2">
          {sessions.map((session) => (
            <li
              key={session.id}
              className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center rounded-md border border-border-subtle p-3"
            >
              <div className="flex items-center gap-3">
                <Monitor className="h-4 w-4 shrink-0 text-text-secondary" aria-hidden="true" />
                <div>
                  <p className="text-body-sm font-medium text-text-primary">
                    {session.userAgentSummary}
                    {session.current && (
                      <span className="ml-2 rounded-full bg-insight/15 px-2 py-0.5 text-caption font-semibold text-insight">
                        Thiết bị này
                      </span>
                    )}
                  </p>
                  <p className="text-caption text-text-secondary">Hoạt động gần nhất {formatWhen(session.lastUsedAt)}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                aria-label={`Đăng xuất ${session.userAgentSummary}${session.current ? ' (thiết bị này)' : ''}`}
                onClick={() => setPendingRevoke(session)}
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                Đăng xuất
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={pendingRevoke !== null}
        closeLabel="Đóng hộp thoại"
        onClose={() => setPendingRevoke(null)}
        title={pendingRevoke?.current ? 'Đăng xuất thiết bị này?' : 'Đăng xuất thiết bị đã chọn?'}
        description={
          pendingRevoke?.current
            ? "Bạn sẽ được đăng xuất khỏi thiết bị này ngay lập tức."
            : 'Phiên đăng nhập trên thiết bị đã chọn sẽ kết thúc ngay lập tức.'
        }
        variant="destructive"
      >
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setPendingRevoke(null)}>
            Hủy
          </Button>
          <Button
            variant="danger"
            loading={revokeMutation.isPending}
            onClick={() => pendingRevoke && revokeMutation.mutate(pendingRevoke)}
          >
            Đăng xuất
          </Button>
        </div>
      </Dialog>

      <Dialog
        open={confirmLogoutAll}
        closeLabel="Đóng hộp thoại"
        onClose={() => setConfirmLogoutAll(false)}
        title="Đăng xuất khỏi mọi thiết bị?"
        description="Tất cả phiên đăng nhập, kể cả thiết bị này, sẽ kết thúc. Bạn sẽ cần đăng nhập lại."
        variant="destructive"
      >
        <div className="flex items-start gap-2 rounded-md border border-caution/30 bg-caution/5 p-3 text-body-sm text-caution">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Bạn cần đăng nhập lại để sử dụng tài khoản trên các thiết bị đó.</span>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirmLogoutAll(false)}>
            Hủy
          </Button>
          <Button variant="danger" loading={logoutAllMutation.isPending} onClick={() => logoutAllMutation.mutate()}>
            Đăng xuất mọi thiết bị
          </Button>
        </div>
      </Dialog>
    </Card>
  );
}
