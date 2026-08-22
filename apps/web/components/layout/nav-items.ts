import type { LucideIcon } from 'lucide-react';
import { Calculator, Compass, Home, ScrollText, Settings, Sparkles, Star } from 'lucide-react';

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
  { label: 'Hôm nay', href: '/', icon: Home },
  { label: 'Lá số Tử Vi', href: '/discover/tu-vi', icon: ScrollText },
  { label: 'Tarot', href: '/discover/tarot', icon: Sparkles },
  { label: 'Bản đồ sao', href: '/discover/natal-chart', icon: Star },
  { label: 'Thần số học', href: '/discover/numerology', icon: Calculator },
  { label: 'Khám phá', href: '/discover', icon: Compass },
  { label: 'Cài đặt', href: '/settings', icon: Settings },
];
