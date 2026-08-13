'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { useAuth, useInvalidateAuth } from '@/providers/auth-provider';
import { Avatar } from '@/components/ui/avatar';
import { IconButton } from '@/components/ui/icon-button';
import { authApi } from '@/features/auth/api/auth-api';
import { toast } from '@/components/ui/toast';
import { NotificationBell } from '@/features/notifications/components/notification-bell';

export function AppHeader() {
  const { user } = useAuth();
  const invalidateAuth = useInvalidateAuth();
  const router = useRouter();

  async function handleLogout() {
    try {
      await authApi.logout();
    } catch {
      // Logout is best-effort client-side too — cookies are cleared server-side
      // regardless of whether this network call itself succeeds.
    }
    invalidateAuth();
    toast.success("You've been logged out.");
    router.push('/login');
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border-subtle px-4 desktop:px-8">
      <div className="desktop:hidden">
        <span className="font-display text-body-lg font-medium text-text-primary">BeaconVie</span>
      </div>
      <div className="ml-auto flex items-center gap-3">
        <NotificationBell />
        {user && <Avatar name={user.displayName} size="sm" />}
        <IconButton aria-label="Log out" onClick={handleLogout}>
          <LogOut className="h-4 w-4" aria-hidden="true" />
        </IconButton>
      </div>
    </header>
  );
}
