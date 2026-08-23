'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { TarotDrawPanel } from './tarot-draw-panel';
import { TarotHistoryList } from './tarot-history-list';
import { TarotReadingDetail } from './tarot-reading-detail';
import { TarotLibrary } from './tarot-library';
import { MvPage, MvPageHeader, MvSection } from '@/components/ui/mv-page';

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
    <MvPage className="rounded-md border border-[rgba(213,173,98,0.14)] bg-[#050B13] p-3 tablet:p-4">
      <MvPageHeader
        eyebrow="Tarot"
        title="Tarot 78 Complete Flow"
        description="Hành trình Tarot trọn vẹn: chọn trải bài, đặt câu hỏi, rút bài server-authoritative, đọc nghĩa chuẩn, rồi lưu lại lịch sử."
        className="border-[rgba(213,173,98,0.28)] bg-[#07111D]"
      />

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
