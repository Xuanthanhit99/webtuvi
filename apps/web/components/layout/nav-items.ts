import type { LucideIcon } from 'lucide-react';
import { Compass, Home, MessageCircle, NotebookPen, Settings } from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  comingSoon?: boolean;
}

// Docs/reference Module 3 §4 Global Navigation: Dashboard, Companion, Journal,
// Discovery Hub, Settings — exactly five destinations, per the product decision
// to follow the Product Bible's IA over the wider nav list in the Sprint 1 brief.
export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: Home },
  { label: 'Companion', href: '/companion', icon: MessageCircle },
  { label: 'Journal', href: '/journal', icon: NotebookPen },
  // Sprint 8 release-closure fix: stale since Sprint 1 (ff77169) — never flipped when Tarot went
  // live in Sprint 6, and by Sprint 8 (Numerology also live) the badge was actively misleading,
  // telling users the whole Discover section was still "Soon" while two of its four systems were
  // real and reachable. Individual systems within /discover still show their own honest per-card
  // "Coming soon" badge (Natal Chart, Eastern Horoscope) — this only removes the false claim about
  // the section as a whole.
  { label: 'Discover', href: '/discover', icon: Compass },
  { label: 'Settings', href: '/settings', icon: Settings },
];
