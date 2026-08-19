'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/ui/logo';

const NAV_LINKS = [
  { label: 'Product', href: '#how-it-works' },
  { label: 'Discover', href: '#discovery' },
  { label: 'Privacy', href: '#privacy' },
  { label: 'About', href: '/about' },
];

// Accessibility + Product Polish (2026-08-19): native <details>/<summary> gives no Escape-to-close
// or outside-click-to-close for free (confirmed live: opened the menu, dispatched Escape and an
// outside click, both left it open) — this wires both, while leaving the existing <details> markup
// and its own toggle behavior untouched.
export function MarketingHeader() {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const node = detailsRef.current;
    if (!node) return;

    function close() {
      // Setting `.open` alone isn't a reliable state-sync signal on its own: whether that fires a
      // native `toggle` event (which onToggle below listens for) varies across engines — call
      // setMenuOpen directly too so aria-expanded/aria-label update deterministically either way.
      if (node!.open) {
        node!.open = false;
        setMenuOpen(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
    }

    function handlePointerDown(e: PointerEvent) {
      if (node!.open && e.target instanceof Node && !node!.contains(e.target)) close();
    }

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, []);

  return (
    <header className="sticky top-0 z-drawer border-b border-border-subtle bg-canvas/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-content items-center justify-between px-4 desktop:px-8">
        <Link href="/" className="shrink-0">
          <Logo />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-8 desktop:flex">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="text-body-sm text-text-secondary hover:text-text-primary">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-4 desktop:flex">
          <Link href="/login" className="text-body-sm text-text-secondary hover:text-text-primary">
            Login
          </Link>
          <Link
            href="/register"
            className="inline-flex h-11 items-center justify-center rounded-md bg-insight px-4 text-body-sm font-semibold text-canvas hover:bg-[#E2C27C] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-insight"
          >
            Meet your Companion
          </Link>
        </div>

        <details
          ref={detailsRef}
          className="group relative desktop:hidden"
          onToggle={(e) => setMenuOpen(e.currentTarget.open)}
        >
          <summary
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-md text-text-primary [&::-webkit-details-marker]:hidden"
          >
            <span className="sr-only">Menu</span>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M2 5h16M2 10h16M2 15h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </summary>
          <div className="absolute right-0 top-12 flex w-56 flex-col gap-1 rounded-md border border-border-subtle bg-surface-raised p-3 shadow-sm">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="min-h-11 rounded-md px-3 py-2 text-body-sm text-text-secondary hover:bg-surface hover:text-text-primary"
              >
                {link.label}
              </a>
            ))}
            <hr className="my-1 border-border-subtle" />
            <Link href="/login" className="min-h-11 rounded-md px-3 py-2 text-body-sm text-text-secondary hover:bg-surface hover:text-text-primary">
              Login
            </Link>
            <Link
              href="/register"
              className="mt-1 flex min-h-11 items-center justify-center rounded-md bg-insight px-3 text-body-sm font-semibold text-canvas"
            >
              Meet your Companion
            </Link>
          </div>
        </details>
      </div>
    </header>
  );
}
