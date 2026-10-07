'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowRight, BriefcaseBusiness, Compass, Heart, Star, UserRound } from 'lucide-react';
import type { TodayOverviewSignal } from './today-overview';
import { ARTICLE_COVER_ASSET, FEATURE_ART_ASSET, FEATURE_BADGE_ASSET, HOME_BACKGROUND, type DiscoveryModuleKey } from './production-assets';

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

const SYSTEM_ORDER: readonly SystemTitle[] = ['Tử Vi', 'Tarot', 'Bản đồ sao', 'Thần số học'];

const SYSTEM_COPY: Record<SystemTitle, { eyebrow: string; description: string }> = {
  'Tử Vi': { eyebrow: 'Lá số & vận trình', description: 'Đọc cấu trúc 12 cung, Đại Vận và Tiểu Hạn từ dữ liệu sinh của bạn.' },
  Tarot: { eyebrow: '78 lá bài thật', description: 'Chọn lá, lật bài và đọc trải bài từ bộ Tarot đầy đủ của Mệnh Vi.' },
  'Bản đồ sao': { eyebrow: 'Bầu trời lúc bạn sinh', description: 'Dựng vòng tròn hành tinh và các góc chiếu từ ngày, giờ và nơi sinh.' },
  'Thần số học': { eyebrow: 'Những con số của bạn', description: 'Khám phá Life Path cùng các chỉ số được tính trực tiếp từ tên và ngày sinh.' },
};

const EDITORIAL = [
  { key: 'tu_vi' as const, title: 'Hiểu cấu trúc lá số Tử Vi', href: '/kien-thuc/tu-vi' },
  { key: 'tarot' as const, title: 'Bắt đầu với 78 lá Tarot', href: '/kien-thuc/tarot' },
  { key: 'natal_chart' as const, title: 'Đọc Bản đồ sao từ nền tảng', href: '/kien-thuc/ban-do-sao' },
  { key: 'numerology' as const, title: 'Nhập môn Thần số học', href: '/kien-thuc/than-so-hoc' },
] as const;

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

  const flowSignals = [
    { label: 'Năng lượng chung', value: signals[0]?.value ?? 'Thích hợp cho việc nhìn lại và lên kế hoạch mới.', href: signals[0]?.href ?? '/discover' },
    { label: 'Tài lộc', value: signals[1]?.value ?? 'Cơ hội nhỏ từ những kết nối cũ.', href: signals[1]?.href ?? '/discover/tu-vi' },
    { label: 'Tình cảm', value: signals[2]?.value ?? 'Dành thời gian lắng nghe nhiều hơn.', href: signals[2]?.href ?? '/discover/tarot' },
    { label: 'Lời khuyên', value: signals[3]?.value ?? 'Giữ cân bằng giữa lý trí và cảm xúc.', href: signals[3]?.href ?? '/discover' },
  ];

  return (
    <div className="space-y-4 desktop:space-y-5">
      <section aria-labelledby="home-v5-heading" className="relative min-h-[520px] overflow-hidden rounded-[4px] border border-[#c8aa72]/15 bg-[#070a0d] shadow-[0_30px_90px_rgba(0,0,0,.35)]">
        <Image src={HOME_BACKGROUND.hero} alt="" fill priority sizes="(min-width:1280px) 1312px, 100vw" className="object-cover object-center" aria-hidden="true" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,7,9,.88)_0%,rgba(5,7,9,.55)_36%,rgba(5,7,9,.10)_68%,rgba(5,7,9,.52)_100%),linear-gradient(0deg,rgba(4,6,8,.72),transparent_42%)]" />
        <div className="relative grid min-h-[520px] desktop:grid-cols-[minmax(0,1fr)_292px]">
          <div className="flex max-w-[760px] flex-col justify-center px-7 py-12 tablet:px-12 desktop:px-16">
            <p className="font-display text-[clamp(3.8rem,6vw,6.2rem)] leading-none text-[#e8bd72]">Mệnh Vi</p>
            <h1 id="home-v5-heading" className="mt-3 max-w-[620px] font-display text-[clamp(2rem,3vw,3.15rem)] font-medium leading-[1.08] text-[#f2eee5]">
              Khám phá bản thân,<br />hiểu rõ hành trình của bạn
            </h1>
            <p className="mt-5 text-body-md text-[#d6d0c5]">Tử Vi · Tarot · Bản đồ sao · Thần số học</p>
            <p className="mt-1 max-w-xl text-body-sm text-[#aaa59c]">Bốn hệ thống, một hành trình thấu hiểu chính mình.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/discover" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#e4bd70] px-7 text-body-sm font-semibold text-[#17110a]">Bắt đầu khám phá <ArrowRight className="h-4 w-4" /></Link>
              <Link href="/about" className="inline-flex min-h-12 items-center gap-2 rounded-full border border-[#d6b06b]/45 bg-black/25 px-7 text-body-sm font-semibold text-[#ead9ba]">Tìm hiểu thêm</Link>
            </div>
          </div>
          <aside className="m-4 self-center rounded-[12px] border border-[#c8aa72]/25 bg-[#080b0e]/90 p-5 backdrop-blur-md desktop:m-5">
            <h2 className="font-display text-heading-md text-[#e5c98e]">Dòng chảy hôm nay</h2>
            <p className="mt-1 text-caption text-[#88857f]">{greeting.replace(',', '')}{!isGuest ? ` · ${userName}` : ''}</p>
            <div className="mt-4 divide-y divide-white/[0.07]">
              {loading ? <div className="h-48 animate-pulse rounded-lg bg-white/[0.04]" /> : flowSignals.map((signal) => (
                <Link key={signal.label} href={signal.href} className="group flex min-h-[72px] gap-3 py-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#c8aa72]/25 bg-[#c8aa72]/10 text-[#e4bd70]">✦</span>
                  <span><b className="block text-caption text-[#eee8dc]">{signal.label}</b><span className="mt-1 line-clamp-2 block text-[12px] leading-4 text-[#9f9b94]">{signal.value}</span></span>
                </Link>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section aria-labelledby="systems-v5-heading">
        <h2 id="systems-v5-heading" className="sr-only">Bốn hệ thống Mệnh Vi</h2>
        <div className="grid gap-3 tablet:grid-cols-2 desktop:grid-cols-4">
          {SYSTEM_ORDER.map((title) => {
            const meta = SYSTEM_META[title]; const copy = SYSTEM_COPY[title];
            const cta = title === 'Tử Vi' ? 'Lập lá số ngay' : title === 'Tarot' ? 'Rút bài Tarot' : title === 'Bản đồ sao' ? 'Xem bản đồ sao' : 'Khám phá ngay';
            return (
              <Link key={title} href={meta.href} className="group relative min-h-[238px] overflow-hidden rounded-[8px] border border-[#c8aa72]/20 bg-[#090d12]">
                <Image src={FEATURE_ART_ASSET[meta.key]} alt="" fill sizes="(min-width:1280px) 25vw,50vw" className="object-cover transition duration-500 group-hover:scale-[1.02]" />
                <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(5,7,9,.98)_0%,rgba(5,7,9,.55)_48%,rgba(5,7,9,.05)_78%)]" />
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <h3 className="font-display text-[1.55rem] text-[#f1e9dc]">{title === 'Tử Vi' ? 'Tử Vi Đẩu Số' : title}</h3>
                  <p className="mt-1 max-w-[240px] text-caption leading-5 text-[#d1cbc0]">{copy.description}</p>
                  <span className="mt-3 inline-flex min-h-9 items-center gap-2 rounded-full bg-[#e4bd70] px-4 text-[12px] font-semibold text-[#17110a]">{cta} <ArrowRight className="h-3.5 w-3.5" /></span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="signals-v5-heading" className="grid gap-3 desktop:grid-cols-[1.2fr_.8fr]">
        <div className="rounded-[8px] border border-white/[0.06] bg-[#080c10] p-5">
          <div className="flex items-end justify-between gap-4">
            <div><h2 id="signals-v5-heading" className="font-display text-heading-md text-[#eee8dc]">Điều đang diễn ra với bạn</h2><p className="mt-1 text-caption text-[#8f8c86]">Dựa trên ngày hôm nay, đây là những chủ đề có thể liên quan đến bạn.</p></div>
            <Link href="/discover" className="hidden items-center gap-2 text-caption font-semibold text-[#e4bd70] tablet:inline-flex">Xem tất cả <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="mt-4 grid gap-3 tablet:grid-cols-2 desktop:grid-cols-4">
            {flowSignals.map((signal, index) => (
              <Link key={signal.label} href={signal.href} className="group overflow-hidden rounded-[7px] border border-white/[0.08] bg-[#0b0f13]">
                <div className="relative aspect-[1.35] overflow-hidden"><Image src={ARTICLE_COVER_ASSET[SYSTEM_META[SYSTEM_ORDER[index]].key]} alt="" fill sizes="220px" className="object-cover transition group-hover:scale-[1.025]" /></div>
                <div className="p-3"><p className="line-clamp-2 text-caption leading-5 text-[#e2ddd3]">{signal.value}</p><span className="mt-3 inline-block rounded-full border border-[#c8aa72]/25 px-2.5 py-1 text-[10px] text-[#d2b77f]">{signal.label}</span></div>
              </Link>
            ))}
          </div>
        </div>
        <div className="relative min-h-[300px] overflow-hidden rounded-[8px] border border-[#c8aa72]/15 bg-[#0a0d10]">
          <Image src={HOME_BACKGROUND.journeyBanner} alt="" fill sizes="520px" className="object-cover opacity-80" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,7,9,.93),rgba(5,7,9,.25))]" />
          <div className="relative max-w-[330px] p-5">
            <h2 className="font-display text-heading-md text-[#ead6ad]">Hành trình khám phá</h2>
            <p className="mt-1 text-caption leading-5 text-[#b0aaa0]">Mỗi câu hỏi là một bước tiến gần hơn đến phiên bản tốt hơn của chính bạn.</p>
            <div className="mt-4 space-y-2 text-caption text-[#e2ddd3]">
              {['Tôi là ai?','Điều gì đang chờ đợi tôi?','Tình yêu của tôi sẽ ra sao?','Sự nghiệp và tài chính thế nào?','Làm thế nào để cân bằng cuộc sống?'].map((q) => <Link key={q} href="/discover" className="flex min-h-9 items-center gap-3"><span className="text-[#e4bd70]">✦</span>{q}</Link>)}
            </div>
          </div>
        </div>
      </section>

      {!isGuest && continuity && (
        <section aria-labelledby="continue-v5-heading" className="rounded-[8px] border border-white/[0.07] bg-[#090d12] px-5 py-4">
          <div className="flex items-center justify-between gap-4"><div><p className="text-[11px] uppercase tracking-[.18em] text-[#a98e61]">Tiếp tục hành trình</p><h2 id="continue-v5-heading" className="mt-1 font-display text-body-lg text-[#eee8dc]">{continuity.title}</h2><p className="mt-1 text-caption text-[#8e8b85]">{continuity.description}</p></div><Link href={continuity.href} className="inline-flex min-h-11 items-center gap-2 text-caption font-semibold text-[#e4bd70]">Tiếp tục <ArrowRight className="h-4 w-4" /></Link></div>
        </section>
      )}

      <section aria-labelledby="editorial-v5-heading" className="rounded-[8px] border border-white/[0.06] bg-[#080c10] p-5">
        <div className="flex items-end justify-between gap-4"><div><h2 id="editorial-v5-heading" className="font-display text-heading-md text-[#eee8dc]">Khám phá thêm</h2><p className="mt-1 text-caption text-[#8f8c86]">Những chủ đề thú vị giúp bạn hiểu sâu hơn về bản thân và thế giới xung quanh.</p></div><Link href="/kien-thuc" className="inline-flex min-h-11 items-center gap-2 text-caption font-semibold text-[#e4bd70]">Xem thêm <ArrowRight className="h-4 w-4" /></Link></div>
        <div className="mt-4 grid gap-3 tablet:grid-cols-2 desktop:grid-cols-4">{EDITORIAL.map((item) => <Link key={item.key} href={item.href} className="group overflow-hidden rounded-[7px] border border-white/[0.07] bg-[#0a0e12]"><div className="relative aspect-[16/9] overflow-hidden"><Image src={ARTICLE_COVER_ASSET[item.key]} alt="" fill sizes="300px" className="object-cover transition group-hover:scale-[1.025]" /></div><div className="p-3"><h3 className="font-display text-body-md text-[#eee8dc]">{item.title}</h3><span className="mt-2 inline-flex items-center gap-2 text-caption text-[#c8aa72]">Đọc tiếp <ArrowRight className="h-3.5 w-3.5" /></span></div></Link>)}</div>
      </section>
    </div>
  );
}
