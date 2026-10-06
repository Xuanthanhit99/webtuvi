'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowRight, BriefcaseBusiness, Compass, Heart, Star, UserRound } from 'lucide-react';
import type { TodayOverviewSignal } from './today-overview';
import { FEATURE_ART_ASSET, FEATURE_BADGE_ASSET, HOME_BACKGROUND, type DiscoveryModuleKey } from './production-assets';

const INTENTS = [
  { key: 'love', label: 'Tình yêu', icon: Heart, title: 'Tarot', href: '/discover/tarot', cta: 'Bắt đầu trải nghiệm', reason: 'Một câu hỏi cụ thể giúp bạn nhìn lại cảm xúc và điều đang hiện diện trong mối quan hệ.' },
  { key: 'work', label: 'Công việc', icon: BriefcaseBusiness, title: 'Tử Vi', href: '/discover/tu-vi', cta: 'Xem vận trình', reason: 'Đặt công việc vào nhịp Đại Vận và Tiểu Hạn để nhìn bức tranh dài hơn.' },
  { key: 'self', label: 'Bản thân', icon: UserRound, title: 'Bản đồ sao', href: '/discover/natal-chart', cta: 'Dựng bản đồ sao', reason: 'Bắt đầu từ cấu trúc bản đồ sinh để hiểu khí chất, nhu cầu và cách bạn kết nối.' },
  { key: 'decision', label: 'Quyết định', icon: Compass, title: 'Tarot', href: '/discover/tarot', cta: 'Đặt câu hỏi', reason: 'Dùng một khoảng dừng có cấu trúc để soi lại điều bạn đang cân nhắc trước khi tự quyết định.' },
  { key: 'future', label: 'Tương lai', icon: Star, title: 'Tử Vi', href: '/discover/tu-vi', cta: 'Lập lá số', reason: 'Đại Vận và Tiểu Hạn cho bạn một khung thời gian để đọc giai đoạn phía trước.' },
] as const;

type SystemTitle = 'Tarot' | 'Tử Vi' | 'Bản đồ sao' | 'Thần số học';

const SYSTEM_META: Record<SystemTitle, { key: DiscoveryModuleKey; href: string }> = {
  'Tử Vi': { key: 'tu_vi', href: '/discover/tu-vi' },
  Tarot: { key: 'tarot', href: '/discover/tarot' },
  'Bản đồ sao': { key: 'natal_chart', href: '/discover/natal-chart' },
  'Thần số học': { key: 'numerology', href: '/discover/numerology' },
};

const SYSTEM_ORDER: readonly SystemTitle[] = ['Tarot', 'Tử Vi', 'Bản đồ sao', 'Thần số học'];

export type HomeV5ContinuityItem = { title: string; description: string; href: string };

function Signal({ signal }: { signal: TodayOverviewSignal }) {
  return (
    <Link href={signal.href} className="group flex min-h-[92px] flex-col justify-between rounded-[14px] border border-white/[0.07] bg-white/[0.025] p-4 transition-colors hover:border-[#c8aa72]/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c8aa72]">
      <span className="text-caption font-medium text-[#c8aa72]">{signal.label}</span>
      <span className="mt-2 line-clamp-2 text-body-sm leading-relaxed text-[#ddd8cf]">{signal.value}</span>
      <ArrowRight className="mt-3 h-4 w-4 text-[#777b84] transition-transform group-hover:translate-x-1" aria-hidden="true" />
    </Link>
  );
}

export function HomeV5Experience({ isGuest, greeting, userName, loading, signals, continuity }: {
  isGuest: boolean; greeting: string; userName: string; loading: boolean; signals: TodayOverviewSignal[]; continuity: HomeV5ContinuityItem | null;
}) {
  const [selectedKey, setSelectedKey] = useState<(typeof INTENTS)[number]['key']>('love');
  const selected = useMemo(() => INTENTS.find((item) => item.key === selectedKey) ?? INTENTS[0], [selectedKey]);
  const selectedMeta = SYSTEM_META[selected.title as SystemTitle];
  const alternatives = SYSTEM_ORDER.filter((title) => title !== selected.title).slice(0, 2);

  return (
    <>
      <section aria-labelledby="home-v5-heading" className="relative overflow-hidden rounded-[22px] border border-white/[0.08] bg-[#080b10] shadow-[0_28px_90px_rgba(0,0,0,0.32)]">
        <Image src={HOME_BACKGROUND.hero} alt="" fill priority sizes="(min-width: 1024px) 1200px, 100vw" className="pointer-events-none object-cover object-[68%_center] opacity-75" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(5,7,10,0.98)_0%,rgba(5,7,10,0.91)_38%,rgba(5,7,10,0.48)_67%,rgba(5,7,10,0.20)_100%),linear-gradient(0deg,rgba(5,7,10,0.70),transparent_48%)]" aria-hidden="true" />
        <div className="relative grid min-h-[430px] items-center gap-8 p-5 min-[430px]:p-7 tablet:p-10 desktop:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.72fr)] desktop:p-12">
          <div className="max-w-[760px]">
            <p className="text-caption font-semibold uppercase tracking-[0.24em] text-[#a98e61]">{isGuest ? 'Hiểu mình sâu hơn · Sống an yên hơn' : greeting}</p>
            <h1 id="home-v5-heading" className="mt-4 max-w-[700px] font-display text-[clamp(2.5rem,5vw,4.8rem)] font-medium leading-[1.02] tracking-[-0.02em] text-[#eee8dc]">
              {isGuest ? 'Điều gì đang ở trong tâm trí bạn?' : <>{userName}, điều gì đang ở trong tâm trí bạn?</>}
            </h1>
            <p className="mt-5 max-w-xl text-body-md leading-7 text-[#aaa8a3]">Mệnh Vi lắng nghe câu hỏi của bạn và mở con đường phù hợp từ Tarot, Tử Vi, Bản đồ sao và Thần số học.</p>
            <div className="mt-8 flex min-h-14 items-center rounded-full border border-[#c8aa72]/45 bg-[#0c1016]/85 p-1.5">
              <span className="pl-4 text-[#c8aa72]" aria-hidden="true">✦</span><span className="min-w-0 flex-1 px-3 text-body-sm text-[#85868a]">Điều gì đang ở trong tâm trí bạn?</span>
              <Link href={selected.href} aria-label={selected.cta} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#e4c895] text-[#15110b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e4c895]"><ArrowRight className="h-5 w-5" aria-hidden="true" /></Link>
            </div>
            <div aria-label="Chọn điều bạn đang quan tâm" className="mt-4 flex flex-wrap gap-2">
              {INTENTS.map((intent) => { const Icon = intent.icon; const active = intent.key === selected.key; return (
                <button key={intent.key} type="button" aria-pressed={active} onClick={() => setSelectedKey(intent.key)}
                  className={active ? 'inline-flex min-h-11 items-center gap-2 rounded-full border border-[#c8aa72]/60 bg-[#c8aa72]/10 px-4 text-caption text-[#eee8dc] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c8aa72]' : 'inline-flex min-h-11 items-center gap-2 rounded-full border border-white/[0.09] px-4 text-caption text-[#aaa8a3] hover:border-[#c8aa72]/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c8aa72]'}>
                  <Icon className="h-4 w-4" aria-hidden="true" />{intent.label}
                </button>
              ); })}
            </div>
          </div>
          <div className="hidden self-stretch border-l border-white/[0.06] pl-10 desktop:flex desktop:flex-col desktop:justify-between">
            <div className="relative min-h-[220px] overflow-hidden rounded-[18px] border border-[#c8aa72]/20 bg-[#080b10]/70 shadow-[0_20px_60px_rgba(0,0,0,0.30)]">
              <Image src={FEATURE_ART_ASSET[selectedMeta.key]} alt="" fill sizes="360px" className="object-cover object-center opacity-95" aria-hidden="true" />
              <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(5,7,10,0.70),transparent_55%)]" aria-hidden="true" />
              <Image src={FEATURE_BADGE_ASSET[selectedMeta.key]} alt="" width={76} height={76} className="absolute bottom-4 left-4 h-[76px] w-[76px] object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.55)]" aria-hidden="true" />
            </div>
            <p className="mt-7 max-w-[280px] font-display text-heading-md italic leading-relaxed text-[#d7c6a8]">“Mỗi câu hỏi đúng cũng là một bước chuyển.”</p>
            <div className="mt-8"><p className="text-caption uppercase tracking-[0.18em] text-[#777b84]">Mệnh Vi gợi ý lúc này</p><p className="mt-2 font-display text-heading-lg text-[#eee8dc]">{selected.title}</p><p className="mt-3 text-body-sm leading-6 text-[#999b9f]">{selected.reason}</p></div>
          </div>
        </div>
      </section>

      <section aria-labelledby="flow-v5-heading" className="rounded-[18px] border border-white/[0.07] bg-[#090d13]/90 p-5 tablet:p-6">
        <div className="flex items-end justify-between gap-4"><div><h2 id="flow-v5-heading" className="font-display text-heading-md font-medium text-[#eee8dc]">Dòng chảy hôm nay</h2><p className="mt-1 text-caption text-[#777b84]">{isGuest ? 'Đăng nhập để mở tín hiệu từ hồ sơ của bạn.' : 'Từ những hồ sơ và lần khám phá bạn đã thực sự tạo.'}</p></div><Link href="/discover" className="hidden min-h-11 items-center gap-2 text-caption font-semibold text-[#c8aa72] tablet:inline-flex">Xem chi tiết <ArrowRight className="h-4 w-4" /></Link></div>
        {loading ? <div className="mt-5 h-24 animate-pulse rounded-[14px] bg-white/[0.04]" /> : signals.length > 0 ? <div className="mt-5 grid gap-3 tablet:grid-cols-2 desktop:grid-cols-4">{signals.map((signal) => <Signal key={signal.label} signal={signal} />)}</div> : <div className="mt-5 rounded-[14px] border border-white/[0.06] p-4 text-body-sm text-[#999b9f]">Chưa có dữ liệu cá nhân. Bắt đầu một trải nghiệm để tạo dòng chảy của riêng bạn.</div>}
      </section>

      <section aria-labelledby="recommend-v5-heading" className="grid overflow-hidden rounded-[18px] border border-white/[0.07] bg-[#090d13] desktop:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)]">
        <div className="relative min-h-[320px] overflow-hidden p-6 tablet:p-8">
          <Image src={FEATURE_ART_ASSET[selectedMeta.key]} alt="" fill sizes="(min-width: 1024px) 720px, 100vw" className="pointer-events-none object-cover object-[72%_center] opacity-45" aria-hidden="true" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,#090d13_0%,rgba(9,13,19,0.94)_48%,rgba(9,13,19,0.32)_100%)]" aria-hidden="true" />
          <div className="relative z-10"><p className="text-caption font-semibold uppercase tracking-[0.18em] text-[#a98e61]">Gợi ý chính · {selected.label}</p><h2 id="recommend-v5-heading" className="mt-3 font-display text-[clamp(2rem,3vw,3rem)] font-medium text-[#eee8dc]">{selected.title}</h2><p className="mt-4 max-w-xl text-body-md leading-7 text-[#aaa8a3]">{selected.reason}</p><Link href={selected.href} className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#e4c895] px-6 text-body-sm font-semibold text-[#15110b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e4c895]">{selected.cta}<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></div></div>
        <div className="border-t border-white/[0.06] p-6 desktop:border-l desktop:border-t-0 desktop:p-8"><p className="text-caption uppercase tracking-[0.18em] text-[#777b84]">Hai góc nhìn khác</p><div className="mt-5 space-y-3">{alternatives.map((title) => { const meta = SYSTEM_META[title]; return <Link key={title} href={meta.href} className="flex min-h-16 items-center justify-between rounded-[13px] border border-white/[0.07] px-4 text-body-sm text-[#ddd8cf] hover:border-[#c8aa72]/30"><span className="flex items-center gap-3"><Image src={FEATURE_BADGE_ASSET[meta.key]} alt="" width={36} height={36} className="h-9 w-9 object-contain opacity-80" aria-hidden="true" />{title}</span><ArrowRight className="h-4 w-4 text-[#777b84]" /></Link>; })}</div></div>
      </section>

      {!isGuest && <section aria-labelledby="continue-v5-heading" className="border-t border-white/[0.07] pt-2"><div className="flex items-center justify-between"><h2 id="continue-v5-heading" className="font-display text-heading-md font-medium text-[#eee8dc]">Tiếp tục hành trình</h2><Link href="/discover" className="inline-flex min-h-11 items-center gap-2 text-caption font-semibold text-[#c8aa72]">Khám phá thêm <ArrowRight className="h-4 w-4" /></Link></div><div className="mt-3">{continuity ? <Link href={continuity.href} className="flex min-h-[86px] items-center justify-between gap-4 rounded-[14px] border border-white/[0.07] bg-white/[0.02] p-4 hover:border-[#c8aa72]/30"><div><p className="text-body-sm font-semibold text-[#ddd8cf]">{continuity.title}</p><p className="mt-1 text-caption text-[#85868a]">{continuity.description}</p></div><ArrowRight className="h-4 w-4 shrink-0 text-[#777b84]" /></Link> : <p className="rounded-[14px] border border-white/[0.06] p-4 text-body-sm text-[#85868a]">Chưa có hành trình gần đây.</p>}</div></section>}

      <section aria-label="Góc nhìn sâu hơn" className="flex flex-col gap-5 rounded-[18px] border border-white/[0.07] bg-[linear-gradient(110deg,#0b0f14,#11100e)] p-6 tablet:flex-row tablet:items-center tablet:justify-between tablet:p-8"><div><p className="text-caption uppercase tracking-[0.18em] text-[#a98e61]">Góc nhìn sâu hơn</p><h2 className="mt-2 max-w-2xl font-display text-heading-md font-medium text-[#eee8dc]">Không chỉ là dự đoán — mỗi công cụ là một góc nhìn để hiểu mình rõ hơn.</h2></div><Link href="/discover" className="inline-flex min-h-11 shrink-0 items-center gap-2 text-body-sm font-semibold text-[#c8aa72]">Khám phá Mệnh Vi <ArrowRight className="h-4 w-4" /></Link></section>
    </>
  );
}
