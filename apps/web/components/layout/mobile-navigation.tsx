'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';
import { NAV_ITEMS } from './nav-items';

// Accessibility + Product Polish (2026-08-19): was `desktop:hidden`, so every tablet width
// (768-1279px) got this phone-style bottom-tab bar instead of Sidebar's new tablet:-width icon
// rail. Now strictly phone-only (<768px) — see sidebar.tsx for the tablet/desktop split.
export function MobileNavigation() {
  const pathname = usePathname();
  const mobileItems = NAV_ITEMS.filter((item) => ['/', '/discover/tu-vi', '/discover/tarot', '/settings'].includes(item.href));

  return (
    <nav
      aria-label="Main navigation"
      className="fixed inset-x-0 bottom-0 z-drawer flex border-t border-border-subtle bg-surface pb-[env(safe-area-inset-bottom)] tablet:hidden"
    >
      {mobileItems.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex min-h-11 flex-1 flex-col items-center justify-center gap-1 py-2 text-caption',
              active ? 'text-insight' : 'text-text-secondary',
            )}
          >
            <item.icon className="h-5 w-5" aria-hidden="true" />
            <span>{item.href === '/settings' ? 'Tôi' : item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
