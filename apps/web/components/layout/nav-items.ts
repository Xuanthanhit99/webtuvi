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
  { label: 'Discover', href: '/discover', icon: Compass, comingSoon: true },
  { label: 'Settings', href: '/settings', icon: Settings },
];
