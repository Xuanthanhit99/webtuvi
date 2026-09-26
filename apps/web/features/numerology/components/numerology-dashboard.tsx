'use client';

import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { NumerologyForm } from './numerology-form';
import { NumerologyHistoryList } from './numerology-history-list';
import { NumerologyReadingDetail } from './numerology-reading-detail';
import { MvPage, MvSection } from '@/components/ui/mv-page';
import { Board04NumberMark } from './board04-number-mark';
import { FEATURE_ART_ASSET } from '@/features/dashboard/components/home/production-assets';

export function NumerologyDashboard() {
  const router = useRouter();
  const activeId = useSearchParams().get('item');
  const selectItem = (id: string | null) => router.replace(id ? `/discover/numerology?item=${id}` : '/discover/numerology', { scroll: false });
  if (activeId) return <NumerologyReadingDetail id={activeId} onClose={() => selectItem(null)} />;

  return (
    <MvPage className="gap-10 pb-10">
      <section className="relative isolate overflow-hidden rounded-xl border border-[#b78ad0]/20 bg-[#080b19] px-5 py-7 shadow-[0_28px_90px_rgba(0,0,0,0.34)] tablet:px-9 tablet:py-10">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_78%_42%,rgba(111,62,151,0.28),transparent_32%),radial-gradient(circle_at_12%_5%,rgba(166,91,148,0.12),transparent_28%),linear-gradient(145deg,rgba(9,13,29,0.96),rgba(18,10,31,0.86))]" />
        <div className="grid items-center gap-5 tablet:grid-cols-[1.1fr_0.9fr] tablet:gap-10">
          <div className="flex flex-col items-start">
            <p className="text-caption font-semibold uppercase tracking-[0.24em] text-[#c39cdb]">Thần số học</p>
            <h1 className="mt-3 max-w-2xl font-serif text-heading-xl leading-tight text-text-primary tablet:text-display-sm">Những con số kể câu chuyện riêng của bạn</h1>
            <p className="mt-4 max-w-xl text-body-md leading-relaxed text-text-secondary">Khám phá sáu chỉ số cốt lõi từ họ tên khai sinh và ngày sinh — rõ ràng, riêng tư và có thể xem lại từng bước tính.</p>
            <a href="#numerology-form" className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-insight px-4 text-body-md font-semibold text-canvas transition duration-fast hover:-translate-y-0.5 hover:bg-[#E6C980] active:translate-y-0 active:bg-[#C59B4F] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-insight motion-reduce:transform-none">Khám phá con số của bạn</a>
          </div>
          <div className="relative mx-auto aspect-[4/3] w-full max-w-[520px] overflow-hidden rounded-xl border border-[#b78ad0]/20 bg-[#080b19]">
            <Image src={FEATURE_ART_ASSET.numerology} alt="Minh họa Thần số học" fill priority sizes="(min-width: 1536px) 520px, (min-width: 768px) 42vw, calc(100vw - 40px)" className="object-cover object-center" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#080b19]/70 via-transparent to-transparent" />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-45"><Board04NumberMark compact /></div>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 border-t border-[#b78ad0]/15 pt-5 text-caption text-text-secondary">
          <span>6 chỉ số cá nhân</span><span>Giữ nguyên số đặc biệt 11 · 22 · 33</span><span>Giải thích từng bước tính</span>
        </div>
      </section>
      <MvSection eyebrow="Hồ sơ cá nhân" title="Bắt đầu từ tên và ngày sinh">
        <div id="numerology-form" className="scroll-mt-6" /><NumerologyForm />
      </MvSection>
      <MvSection eyebrow="Xem lại" title="Hồ sơ gần đây"><NumerologyHistoryList filters={{}} onSelect={selectItem} /></MvSection>
    </MvPage>
  );
}
