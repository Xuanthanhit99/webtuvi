'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronDown, LogOut, Settings, Shield, Sparkles } from 'lucide-react';
import { useAuth, useInvalidateAuth } from '@/providers/auth-provider';
import { Avatar } from '@/components/ui/avatar';
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
      toast.error('Chưa thể đăng xuất. Vui lòng kiểm tra kết nối và thử lại.');
      return;
    }
    resetAnonymousId();
    await invalidateAuth(true);
    toast.success('Đã đăng xuất.');
    router.push('/login');
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border-subtle px-4 tablet:px-8">
      {/* Accessibility + Product Polish (2026-08-19): Sidebar now renders its own logo at
          tablet:+ (see sidebar.tsx), so this text-only fallback brand mark is phone-only too. */}
      <div className="tablet:hidden">
        <span className="font-display text-body-lg font-semibold text-text-primary">Mệnh Vi</span>
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
        {user && <ProfileMenu displayName={user.displayName} onLogout={handleLogout} />}
      </div>
    </header>
  );
}

function ProfileMenu({ displayName, onLogout }: { displayName: string; onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Menu tài khoản"
        className={cn(
          'flex h-11 items-center gap-2 rounded-full px-2 text-text-secondary',
          'hover:bg-surface hover:text-text-primary transition-colors duration-fast',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-insight',
        )}
      >
        <Avatar name={displayName} size="sm" />
        <span className="hidden max-w-[10rem] truncate text-body-sm font-medium text-text-primary tablet:inline">
          {displayName}
        </span>
        <ChevronDown className={cn('hidden h-4 w-4 transition-transform tablet:inline', open && 'rotate-180')} aria-hidden="true" />
      </button>

      {open && (
        <div
          role="menu"
          aria-label={`${displayName} — tài khoản`}
          className="absolute right-0 top-full z-dropdown mt-2 w-52 rounded-lg border border-border-subtle bg-surface-raised py-1.5 shadow-[0_12px_28px_rgba(0,0,0,0.45)]"
        >
          <Link
            href="/settings"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3.5 py-2 text-body-sm text-text-secondary transition-colors duration-fast hover:bg-surface hover:text-text-primary"
          >
            <Settings className="h-4 w-4" aria-hidden="true" />
            Cài đặt
          </Link>
          <Link
            href="/premium"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3.5 py-2 text-body-sm text-text-secondary transition-colors duration-fast hover:bg-surface hover:text-text-primary"
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Gói Premium
          </Link>
          <div role="separator" className="my-1.5 border-t border-border-subtle" />
          <button
            type="button"
            role="menuitem"
            aria-label="Log out"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-body-sm text-text-secondary transition-colors duration-fast hover:bg-surface hover:text-text-primary"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
}
