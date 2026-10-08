'use client';

import Link from 'next/link';
import { Search } from 'lucide-react';
import { NotificationBell } from '@/features/notifications/components/notification-bell';
import { useAuth } from '@/providers/auth-provider';

export function HomeHeader() {
  const { user } = useAuth();
  return <header className="hidden h-[58px] shrink-0 items-center gap-5 border-b border-white/[0.055] bg-[#07090b]/95 px-5 tablet:flex">
    <label className="relative max-w-[560px] flex-1">
      <span className="sr-only">Tìm kiếm</span><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" aria-hidden="true" />
      <input type="search" placeholder="Tìm kiếm lá bài, cung hoàng đạo, ý nghĩa, ..." className="h-9 w-full rounded-full border border-white/[0.08] bg-white/[0.035] pl-11 pr-4 text-[12px] text-white/80 outline-none placeholder:text-white/30 focus:border-[#d4af70]/40" />
    </label>
    <div className="ml-auto flex items-center gap-2"><span aria-hidden="true" className="grid h-9 w-9 place-items-center rounded-full text-[#d8b76f]">☾</span>{user && <NotificationBell />}{user ? <Link href="/settings" className="max-w-[150px] truncate text-[12px] text-white/65">{user.displayName}</Link> : <Link href="/login" className="rounded-full border border-[#d4af70]/35 px-4 py-2 text-[12px] text-[#e2c381]">Đăng nhập</Link>}</div>
  </header>;
}
