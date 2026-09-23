'use client';

import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { TarotDrawPanel } from './tarot-draw-panel';
import { TarotHistoryList } from './tarot-history-list';
import { TarotReadingDetail } from './tarot-reading-detail';
import { TarotLibrary } from './tarot-library';
import { MvPage, MvSection } from '@/components/ui/mv-page';
import { FEATURE_ART_ASSET } from '@/features/dashboard/components/home/production-assets';

/**
 * `/discover/tarot` — deck intro, draw, reading result, and history, using the same `?item=<id>`
 * "open detail in place" pattern every other module in this product already uses (Memory/Insight/
 * Review/Goal).
 */
export function TarotDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeId = searchParams.get('item');

  function selectItem(id: string | null) {
    router.replace(id ? `/discover/tarot?item=${id}` : '/discover/tarot', { scroll: false });
  }

  if (activeId) {
    return <TarotReadingDetail id={activeId} onClose={() => selectItem(null)} />;
  }

  return (
    <MvPage>
      <header className="relative isolate overflow-hidden rounded-xl border border-[#8d78b6]/20 bg-[#090b18] px-5 py-7 tablet:px-8 tablet:py-9">
        <Image src={FEATURE_ART_ASSET.tarot} alt="Bộ bài Tarot Mệnh Vi" fill priority sizes="(min-width: 1536px) 1248px, (min-width: 1280px) calc(100vw - 288px), 100vw" className="-z-10 object-cover object-[76%_45%] opacity-50 tablet:opacity-55" />
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-[#090b18] via-[#090b18]/90 to-[#090b18]/25" />
        <div className="max-w-2xl">
          <p className="relative text-caption font-semibold uppercase tracking-[0.24em] text-[#c6a9df]">Bộ bài 78 lá · Một khoảng lặng để soi chiếu</p>
          <h1 className="relative mt-2 font-display text-[clamp(2.25rem,5vw,4rem)] font-semibold leading-none text-[#f2eee5]">Tarot</h1>
          <p className="relative mt-3 text-body-md leading-relaxed text-[#d0c9d8]">Chọn một cách trải bài, giữ trong lòng điều bạn muốn nhìn rõ, rồi tự tay chọn những lá bài dành cho khoảnh khắc này.</p>
        </div>
      </header>

      <MvSection eyebrow="Bắt đầu" title="Trải bài Tarot">
        <TarotDrawPanel onDrawn={() => undefined} />
      </MvSection>

      <MvSection eyebrow="Dòng thời gian" title="Trải bài đã lưu">
        <TarotHistoryList filters={{}} onSelect={selectItem} />
      </MvSection>

      <MvSection eyebrow="Bộ bài" title="Thư viện">
        <TarotLibrary />
      </MvSection>
    </MvPage>
  );
}
