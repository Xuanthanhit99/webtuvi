'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';
import { MV_MOBILE_NAV } from '../lib/nav-items';

/**
 * Bottom tab bar for small screens. The center "Khám phá" destination keeps a distinct filled
 * treatment, but restrained — no glow, modest size step — so it reads as an affordance rather
 * than competing with page content for attention. Respects safe-area insets for notched devices.
 */
export function MvMobileNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Điều hướng chính"
      className="fixed inset-x-0 bottom-0 z-dropdown border-t border-mv-border bg-mv-elevated/95 backdrop-blur-md tablet:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="flex items-stretch justify-between px-2">
        {MV_MOBILE_NAV.map((item, i) => {
          const active = item.href === '/menh-vi' ? pathname === item.href : pathname?.startsWith(item.href);
          const isCenter = i === 2;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className="flex flex-col items-center gap-1 py-2 text-caption"
              >
                <span
                  className={cn(
                    'flex items-center justify-center rounded-full transition-colors duration-fast',
                    isCenter ? 'h-9 w-9 -translate-y-1 bg-mv-violet text-mv-text' : 'h-8 w-8',
                    !isCenter && active && 'text-mv-gold',
                    !isCenter && !active && 'text-mv-text-secondary',
                  )}
                >
                  <item.icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className={cn(active ? 'text-mv-gold' : 'text-mv-text-secondary', isCenter && '-mt-0.5')}>
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
