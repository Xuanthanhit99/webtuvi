import type { LucideIcon } from 'lucide-react';
import {
  Sparkles,
  ScrollText,
  Layers,
  Orbit,
  Hash,
  Compass,
  Users,
  User,
  Heart,
  Briefcase,
  Coins,
  HeartPulse,
  NotebookText,
} from 'lucide-react';

export interface MvNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

// Desktop top nav — spans the full-width bar, coexists with the sidebar below it, per the
// reference screenshot (docs/design/menh-vi-reference-breakdown.md §1, superseded — reference
// fidelity now takes priority over the earlier "no SaaS sidebar" deviation).
export const MV_TOP_NAV: MvNavItem[] = [
  { href: '/menh-vi', label: 'Hôm nay', icon: Sparkles },
  { href: '/menh-vi/la-so', label: 'Lá số tử vi', icon: ScrollText },
  { href: '/menh-vi/tarot', label: 'Tarot', icon: Layers },
  { href: '/menh-vi/ban-do-sao', label: 'Bản đồ sao', icon: Orbit },
  { href: '/menh-vi/than-so-hoc', label: 'Thần số học', icon: Hash },
  { href: '/menh-vi/kham-pha', label: 'Khám phá', icon: Compass },
  { href: '/menh-vi/cong-dong', label: 'Cộng đồng', icon: Users },
];

// Desktop left sidebar — the reference's full destination list.
export const MV_SIDEBAR_NAV: MvNavItem[] = [
  { href: '/menh-vi', label: 'Tổng quan', icon: Sparkles },
  { href: '/menh-vi/la-so', label: 'Lá số của tôi', icon: ScrollText },
  { href: '/menh-vi/tarot', label: 'Tarot', icon: Layers },
  { href: '/menh-vi/ban-do-sao', label: 'Bản đồ sao', icon: Orbit },
  { href: '/menh-vi/than-so-hoc', label: 'Thần số học', icon: Hash },
  { href: '/menh-vi/tinh-duyen', label: 'Tình duyên', icon: Heart },
  { href: '/menh-vi/su-nghiep', label: 'Sự nghiệp', icon: Briefcase },
  { href: '/menh-vi/tai-chinh', label: 'Tài chính', icon: Coins },
  { href: '/menh-vi/suc-khoe', label: 'Sức khỏe', icon: HeartPulse },
  { href: '/menh-vi/nhat-ky-van-menh', label: 'Nhật ký vận mệnh', icon: NotebookText },
  { href: '/menh-vi/cong-dong', label: 'Cộng đồng', icon: Users },
];

// Mobile bottom tab bar — separate composition, per brief's suggested mobile IA.
export const MV_MOBILE_NAV: MvNavItem[] = [
  { href: '/menh-vi', label: 'Hôm nay', icon: Sparkles },
  { href: '/menh-vi/la-so', label: 'Lá số', icon: ScrollText },
  { href: '/menh-vi/kham-pha', label: 'Khám phá', icon: Compass },
  { href: '/menh-vi/cong-dong', label: 'Kết nối', icon: Users },
  { href: '/menh-vi/toi', label: 'Tôi', icon: User },
];
