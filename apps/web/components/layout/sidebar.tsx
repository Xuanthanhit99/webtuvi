'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/ui/logo';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/cn';
import { NAV_ITEMS } from './nav-items';

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main navigation"
      className="hidden w-60 shrink-0 flex-col gap-6 border-r border-border-subtle bg-canvas px-4 py-6 desktop:flex"
    >
      <Link href="/dashboard" className="px-2">
        <Logo />
      </Link>
      <ul className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-body-md transition-colors duration-fast',
                  active
                    ? 'bg-surface text-text-primary'
                    : 'text-text-secondary hover:bg-surface hover:text-text-primary',
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="flex-1">{item.label}</span>
                {item.comingSoon && (
                  <Badge variant="neutral" className="shrink-0">
                    Soon
                  </Badge>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
