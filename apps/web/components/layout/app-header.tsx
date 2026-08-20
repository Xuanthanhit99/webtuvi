'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, Shield } from 'lucide-react';
import { useAuth, useInvalidateAuth } from '@/providers/auth-provider';
import { Avatar } from '@/components/ui/avatar';
import { IconButton } from '@/components/ui/icon-button';
import { authApi } from '@/features/auth/api/auth-api';
import { toast } from '@/components/ui/toast';
import { NotificationBell } from '@/features/notifications/components/notification-bell';
import { resetAnonymousId } from '@/lib/analytics';
import { cn } from '@/lib/cn';

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
    resetAnonymousId();
    invalidateAuth();
    toast.success("You've been logged out.");
    router.push('/login');
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border-subtle px-4 tablet:px-8">
      {/* Accessibility + Product Polish (2026-08-19): Sidebar now renders its own logo at
          tablet:+ (see sidebar.tsx), so this text-only fallback brand mark is phone-only too. */}
      <div className="tablet:hidden">
        <span className="font-display text-body-lg font-medium text-text-primary">Tử Vi Tarot</span>
      </div>
      <div className="ml-auto flex items-center gap-3">
        {/* Interim Sprint — Admin Operator Tooling: UI-only convenience — the API's AdminGuard is
            the real authorization boundary, re-checked live on every /admin/* request regardless
            of whether this link is ever rendered. */}
        {user?.role === 'ADMIN' && (
          <Link
            href="/admin"
            aria-label="Operator Tools"
            className={cn(
              'inline-flex h-11 w-11 items-center justify-center rounded-full text-text-secondary',
              'hover:bg-surface hover:text-text-primary transition-colors duration-fast',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-insight',
            )}
          >
            <Shield className="h-4 w-4" aria-hidden="true" />
          </Link>
        )}
        <NotificationBell />
        {user && <Avatar name={user.displayName} size="sm" />}
        <IconButton aria-label="Log out" onClick={handleLogout}>
          <LogOut className="h-4 w-4" aria-hidden="true" />
        </IconButton>
      </div>
    </header>
  );
}
