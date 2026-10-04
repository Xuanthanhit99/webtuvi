'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, Compass, Sparkles } from 'lucide-react';
import { AnalyticsPageView } from '@/components/analytics/analytics-page-view';
import { FEATURE_BADGE_ASSET } from '@/features/dashboard/components/home/production-assets';

type SystemKey = 'tu_vi' | 'tarot' | 'natal_chart' | 'numerology';
type IntentKey = 'love' | 'work' | 'self' | 'decision' | 'future';

const SYSTEMS: Record<SystemKey, { title: string; href: string; description: string }> = {
  tu_vi: { title: 'Tử Vi Lá Số', href: '/discover/tu-vi', description: 'Nhìn vào vận trình và cấu trúc cuộc đời qua lá số Tử Vi Đẩu Số.' },
  tarot: { title: 'Tarot', href: '/discover/tarot', description: 'Soi sáng một câu hỏi đang hiện diện bằng góc nhìn từ bộ bài 78 lá.' },
  natal_chart: { title: 'Bản Đồ Sao', href: '/discover/natal-chart', description: 'Khám phá khí chất, cảm xúc và cách kết nối từ bầu trời lúc bạn sinh ra.' },
  numerology: { title: 'Thần Số Học', href: '/discover/numerology', description: 'Đọc những chỉ số cốt lõi được hình thành từ họ tên khai sinh và ngày sinh.' },
};

const INTENTS: Array<{ key: IntentKey; label: string; question: string; primary: SystemKey; alternatives: SystemKey[]; why: string }> = [
  { key: 'love', label: 'Tình yêu', question: 'Mình nên nhìn mối quan hệ này như thế nào?', primary: 'tarot', alternatives: ['natal_chart', 'tu_vi'], why: 'Tarot phù hợp khi bạn đang có một câu hỏi tình cảm cụ thể và cần thêm một góc nhìn để suy ngẫm ở hiện tại.' },
  { key: 'work', label: 'Công việc', question: 'Công việc và hướng đi sắp tới của mình ra sao?', primary: 'tu_vi', alternatives: ['numerology', 'tarot'], why: 'Tử Vi phù hợp khi bạn muốn nhìn công việc trong bức tranh vận trình rộng hơn, dựa trên dữ liệu ngày giờ sinh.' },
  { key: 'self', label: 'Bản thân', question: 'Điều gì tạo nên con người và cách mình kết nối?', primary: 'natal_chart', alternatives: ['numerology', 'tu_vi'], why: 'Bản đồ sao phù hợp khi câu hỏi hướng vào khí chất, cảm xúc và cách bạn tương tác với thế giới.' },
  { key: 'decision', label: 'Quyết định', question: 'Mình cần nhìn rõ điều gì trước lựa chọn này?', primary: 'tarot', alternatives: ['numerology', 'tu_vi'], why: 'Tarot tạo một khoảng dừng để nhìn lựa chọn từ nhiều biểu tượng và góc độ; quyết định cuối cùng vẫn thuộc về bạn.' },
  { key: 'future', label: 'Tương lai', question: 'Mình đang ở đâu trong hành trình dài hơn?', primary: 'tu_vi', alternatives: ['natal_chart', 'numerology'], why: 'Tử Vi phù hợp để nhìn các chu kỳ và vận trình dài hạn; đây là một hệ diễn giải, không phải lời khẳng định chắc chắn về tương lai.' },
];

export default function DiscoverPage() {
  const [intentKey, setIntentKey] = useState<IntentKey>('love');
  const intent = INTENTS.find((item) => item.key === intentKey) ?? INTENTS[0]!;
  const primary = SYSTEMS[intent.primary];

  return (
    <div className="flex flex-col gap-8 pb-12 text-[#f2eee5] tablet:gap-10">
      <AnalyticsPageView event="discover_viewed" properties={{ feature: 'discover' }} />

      <header className="relative isolate overflow-hidden rounded-2xl border border-[#d5ad62]/20 bg-[#080d18] px-5 py-8 tablet:px-9 tablet:py-10 desktop:px-12">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_82%_16%,rgba(86,110,163,0.18),transparent_26%),linear-gradient(135deg,rgba(8,15,27,0.99),rgba(14,13,24,0.94))]" />
        <p className="text-caption font-semibold uppercase tracking-[0.24em] text-[#d5ad62]">Khám phá cùng Mệnh Vi</p>
        <h1 className="mt-3 max-w-3xl font-serif text-heading-xl leading-tight tablet:text-display-sm">Điều gì đang khiến bạn bận lòng?</h1>
        <p className="mt-4 max-w-2xl text-body-md leading-relaxed text-text-secondary">Bắt đầu từ câu hỏi của bạn. Mệnh Vi sẽ gợi ý một hệ quy chiếu phù hợp để khám phá — không có lựa chọn nào là “đúng” duy nhất.</p>

        <div className="mt-7 flex flex-wrap gap-2" aria-label="Chọn điều bạn đang quan tâm">
          {INTENTS.map((item) => (
            <button key={item.key} type="button" aria-pressed={intentKey === item.key} onClick={() => setIntentKey(item.key)} className={`min-h-11 rounded-full border px-4 text-body-sm font-semibold transition ${intentKey === item.key ? 'border-[#d5ad62]/60 bg-[#d5ad62]/12 text-[#f0d89d]' : 'border-white/10 bg-white/[0.025] text-text-secondary hover:border-[#d5ad62]/30 hover:text-text-primary'}`}>
              {item.label}
            </button>
          ))}
        </div>
        <div className="mt-5 flex items-start gap-3 border-t border-white/10 pt-5 text-body-sm text-text-secondary"><Compass className="mt-0.5 h-5 w-5 shrink-0 text-[#d5ad62]" aria-hidden="true" /><p>{intent.question}</p></div>
      </header>

      <section aria-labelledby="recommendation-heading" className="grid gap-4 desktop:grid-cols-[minmax(0,1.35fr)_minmax(18rem,.65fr)]">
        <div className="relative overflow-hidden rounded-2xl border border-[#d5ad62]/25 bg-[#0a101c] p-6 tablet:p-8">
          <div className="grid items-center gap-7 tablet:grid-cols-[minmax(0,1fr)_12rem]">
            <div>
              <p className="text-caption font-semibold uppercase tracking-[0.2em] text-[#d5ad62]">Mệnh Vi gợi ý bắt đầu từ</p>
              <h2 id="recommendation-heading" className="mt-2 font-serif text-heading-lg text-text-primary">{primary.title}</h2>
              <p className="mt-3 max-w-2xl text-body-md leading-relaxed text-text-secondary">{primary.description}</p>
              <Link href={primary.href} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#d5ad62] px-5 font-semibold text-[#15110a] transition hover:bg-[#e2bf79] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f0d89d]">Bắt đầu với {primary.title} <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
            </div>
            <div className="mx-auto flex h-44 w-44 items-center justify-center rounded-full border border-[#d5ad62]/15 bg-[#d5ad62]/[0.035]">
              <Image src={FEATURE_BADGE_ASSET[intent.primary]} alt="" width={160} height={160} className="h-36 w-36 object-contain opacity-90" aria-hidden="true" />
            </div>
          </div>
        </div>

        <aside className="rounded-2xl border border-white/10 bg-[#0a0f19] p-5 tablet:p-6">
          <p className="text-caption font-semibold uppercase tracking-[0.18em] text-text-tertiary">Bạn cũng có thể thử</p>
          <div className="mt-4 divide-y divide-white/10">
            {intent.alternatives.map((key) => {
              const system = SYSTEMS[key];
              return <Link key={key} href={system.href} className="group flex min-h-[5.25rem] items-center gap-3 py-3"><Image src={FEATURE_BADGE_ASSET[key]} alt="" width={48} height={48} className="h-12 w-12 shrink-0 object-contain opacity-80" aria-hidden="true" /><div className="min-w-0 flex-1"><p className="font-serif text-heading-sm text-text-primary">{system.title}</p><p className="mt-1 line-clamp-2 text-caption leading-relaxed text-text-secondary">{system.description}</p></div><ArrowRight className="h-4 w-4 shrink-0 text-[#d5ad62] transition-transform group-hover:translate-x-1" aria-hidden="true" /></Link>;
            })}
          </div>
        </aside>
      </section>

      <section aria-labelledby="why-heading" className="rounded-2xl border border-[#8f78b5]/20 bg-[radial-gradient(circle_at_88%_30%,rgba(99,74,139,0.16),transparent_30%),#0b101d] p-5 tablet:p-8">
        <div className="grid gap-5 tablet:grid-cols-[auto_minmax(0,1fr)] tablet:items-start">
          <Sparkles className="h-8 w-8 text-[#c5a8db]" aria-hidden="true" />
          <div><p className="text-caption font-semibold uppercase tracking-[0.18em] text-[#c5a8db]">Vì sao gợi ý này phù hợp?</p><h2 id="why-heading" className="mt-2 font-serif text-heading-md text-text-primary">Một điểm bắt đầu, không phải một phán quyết</h2><p className="mt-3 max-w-3xl text-body-sm leading-relaxed text-text-secondary">{intent.why}</p></div>
        </div>
      </section>

      <section aria-labelledby="eastern-heading" className="border-t border-white/10 pt-7">
        <div className="flex flex-col gap-4 tablet:flex-row tablet:items-center tablet:justify-between">
          <div><p className="text-caption font-semibold uppercase tracking-[0.18em] text-[#d5ad62]">Một lăng kính khác</p><h2 id="eastern-heading" className="mt-1 font-serif text-heading-md text-text-primary">Ngũ Hành Phương Đông</h2><p className="mt-2 max-w-2xl text-body-sm text-text-secondary">Khám phá con giáp và ngũ hành từ ngày sinh. Đây là một hệ riêng, không phải lá số Tử Vi Đẩu Số.</p></div>
          <Link href="/discover/eastern-horoscope" className="inline-flex min-h-11 shrink-0 items-center gap-2 self-start font-semibold text-[#e6c980] tablet:self-auto">Khám phá Ngũ Hành <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
        </div>
      </section>
    </div>
  );
}
