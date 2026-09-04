'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { TarotDrawPanel } from './tarot-draw-panel';
import { TarotHistoryList } from './tarot-history-list';
import { TarotReadingDetail } from './tarot-reading-detail';
import { TarotLibrary } from './tarot-library';
import { MvPage, MvSection } from '@/components/ui/mv-page';

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
      <header className="relative overflow-hidden border-b border-[#8d78b6]/20 pb-6 pt-1 tablet:pb-8">
        <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-[#5d477f]/10 blur-3xl" />
        <p className="relative text-caption font-semibold uppercase tracking-[0.24em] text-[#c6a9df]">Bộ bài 78 lá · Một khoảng lặng để soi chiếu</p>
        <h1 className="relative mt-2 font-display text-[clamp(2.25rem,5vw,4rem)] font-semibold leading-none text-[#f2eee5]">Tarot</h1>
        <p className="relative mt-3 max-w-2xl text-body-md leading-relaxed text-[#b9b2c4]">
          Chọn một cách trải bài, giữ trong lòng điều bạn muốn nhìn rõ, rồi tự tay chọn những lá bài dành cho khoảnh khắc này.
        </p>
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
