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
  return new Date(iso).toLocaleString(undefined, {
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
    onSuccess: (_data, session) => {
      setPendingRevoke(null);
      if (session.current) {
        invalidateAuth();
        toast.success("You've been signed out of this device.");
        router.push('/login');
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      toast.success('That session was signed out.');
    },
    onError: () => {
      setPendingRevoke(null);
      toast.error("Couldn't sign out that session. Please try again.");
    },
  });

  const logoutAllMutation = useMutation({
    mutationFn: authApi.logoutAll,
    onSuccess: () => {
      setConfirmLogoutAll(false);
      invalidateAuth();
      toast.success("You've been signed out of every device.");
      router.push('/login');
    },
    onError: () => {
      setConfirmLogoutAll(false);
      toast.error("Couldn't sign out all devices. Please try again.");
    },
  });

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-body-sm font-semibold text-text-secondary">Active sessions</p>
        {sessions && sessions.length > 0 && (
          <Button
            variant="danger"
            size="sm"
            onClick={() => setConfirmLogoutAll(true)}
            loading={logoutAllMutation.isPending}
          >
            Sign out all
          </Button>
        )}
      </div>

      {isLoading && (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      )}

      {isError && !isLoading && (
        <ErrorState
          title="Couldn't load your sessions"
          description="Please try again."
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !isError && sessions && sessions.length === 0 && (
        <EmptyState title="No active sessions" description="You're not signed in anywhere right now." />
      )}

      {!isLoading && !isError && sessions && sessions.length > 0 && (
        <ul className="flex flex-col gap-2">
          {sessions.map((session) => (
            <li
              key={session.id}
              className="flex items-center justify-between gap-3 rounded-md border border-border-subtle p-3"
            >
              <div className="flex items-center gap-3">
                <Monitor className="h-4 w-4 shrink-0 text-text-secondary" aria-hidden="true" />
                <div>
                  <p className="text-body-sm font-medium text-text-primary">
                    {session.userAgentSummary}
                    {session.current && (
                      <span className="ml-2 rounded-full bg-insight/15 px-2 py-0.5 text-caption font-semibold text-insight">
                        This device
                      </span>
                    )}
                  </p>
                  <p className="text-caption text-text-secondary">Last active {formatWhen(session.lastUsedAt)}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                aria-label={`Sign out ${session.userAgentSummary}${session.current ? ' (this device)' : ''}`}
                onClick={() => setPendingRevoke(session)}
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                Sign out
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={pendingRevoke !== null}
        onClose={() => setPendingRevoke(null)}
        title={pendingRevoke?.current ? 'Sign out this device?' : 'Sign out that device?'}
        description={
          pendingRevoke?.current
            ? "You'll be signed out here right away."
            : 'That session will be signed out immediately.'
        }
        variant="destructive"
      >
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setPendingRevoke(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={revokeMutation.isPending}
            onClick={() => pendingRevoke && revokeMutation.mutate(pendingRevoke)}
          >
            Sign out
          </Button>
        </div>
      </Dialog>

      <Dialog
        open={confirmLogoutAll}
        onClose={() => setConfirmLogoutAll(false)}
        title="Sign out of every device?"
        description="This immediately ends every active session, including this one. You'll need to log in again."
        variant="destructive"
      >
        <div className="flex items-start gap-2 rounded-md border border-caution/30 bg-caution/5 p-3 text-body-sm text-caution">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>This can’t be undone.</span>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirmLogoutAll(false)}>
            Cancel
          </Button>
          <Button variant="danger" loading={logoutAllMutation.isPending} onClick={() => logoutAllMutation.mutate()}>
            Sign out everywhere
          </Button>
        </div>
      </Dialog>
    </Card>
  );
}
