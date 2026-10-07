'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, BookOpen, Compass, Heart, History, Home, MessageCircle, MoonStar, Orbit, Sparkles, Star } from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { cn } from '@/lib/cn';
import { HOME_BACKGROUND } from '@/features/dashboard/components/home/production-assets';

const PRIMARY = [
  { label: 'Trang chủ', href: '/', icon: Home },
  { label: 'Tử Vi', href: '/discover/tu-vi', icon: Star },
  { label: 'Tarot', href: '/discover/tarot', icon: Sparkles },
  { label: 'Bản đồ sao', href: '/discover/natal-chart', icon: Orbit },
  { label: 'Thần số học', href: '/discover/numerology', icon: MoonStar },
  { label: 'Kiến thức', href: '/kien-thuc', icon: BookOpen },
  { label: 'Cộng đồng', href: '/community', icon: MessageCircle },
] as const;
const SECONDARY = [
  { label: 'Kết quả của tôi', href: '/history', icon: History },
  { label: 'Yêu thích', href: '/favorites', icon: Heart },
  { label: 'Thông báo', href: '/notifications', icon: Bell },
] as const;

export function HomeSidebar() {
  const pathname = usePathname();
  const item = ({ label, href, icon: Icon }: (typeof PRIMARY)[number] | (typeof SECONDARY)[number]) => {
    const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
    return <li key={href}><Link href={href} aria-current={active ? 'page' : undefined} className={cn('flex min-h-11 items-center gap-3.5 border-l-2 px-4 text-[14px] transition', active ? 'border-[#d6ad63] bg-[#d6ad63]/[0.08] text-[#e9c77e]' : 'border-transparent text-white/55 hover:bg-white/[0.035] hover:text-white/85')}><Icon className="h-[18px] w-[18px]" aria-hidden="true" /><span>{label}</span></Link></li>;
  };
  return <nav aria-label="Điều hướng chính" className="relative hidden w-[204px] shrink-0 overflow-hidden border-r border-[#c7a563]/15 bg-[#06080a] tablet:flex tablet:w-16 tablet:flex-col desktop:w-[224px]">
    <div className="px-4 pb-5 pt-6 tablet:px-2 desktop:px-5"><Link href="/" aria-label="Mệnh Vi" className="flex items-center gap-2"><Logo withWordmark={false} /><span className="hidden text-[11px] font-semibold tracking-[.18em] text-[#e6c781] desktop:inline">TUVITAROT.VN</span></Link></div>
    <ul className="space-y-0.5 tablet:[&_span]:hidden desktop:[&_span]:inline">{PRIMARY.map(item)}</ul>
    <div className="mx-4 my-4 border-t border-white/[0.07]" />
    <ul className="space-y-0.5 tablet:[&_span]:hidden desktop:[&_span]:inline">{SECONDARY.map(item)}</ul>
    <div className="relative mt-auto hidden min-h-[285px] overflow-hidden desktop:block">
      <div className="absolute inset-0 bg-cover bg-center opacity-60" style={{ backgroundImage: `url("${HOME_BACKGROUND.journeyBanner}")` }} />
      <div className="absolute inset-0 bg-gradient-to-b from-[#06080a] via-[#06080a]/45 to-[#06080a]/80" />
      <div className="relative flex h-full min-h-[285px] items-end p-5"><p className="font-display text-[14px] leading-6 tracking-[.08em] text-[#dfc58f]">MỌI HÀNH TRÌNH<br />ĐỀU BẮT ĐẦU TỪ<br />SỰ THẤU HIỂU CHÍNH MÌNH</p></div>
    </div>
  </nav>;
}
