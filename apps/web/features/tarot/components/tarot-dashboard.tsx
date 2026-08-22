'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { TarotDrawPanel } from './tarot-draw-panel';
import { TarotHistoryList } from './tarot-history-list';
import { TarotReadingDetail } from './tarot-reading-detail';
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
    <MvPage>
      <MvPageHeader
        eyebrow="Tarot"
        title="Một nghi thức nhỏ để nhìn rõ điều đang băn khoăn"
        description="Rút bài từ bộ 78 lá thật. Lá bài được backend chọn và lưu lại; phần luận giải chỉ phản chiếu những lá đã rút, không tự tạo lịch sử hay kết quả giả."
      />

      <MvSection eyebrow="Bắt đầu" title="Rút bài">
        <TarotDrawPanel onDrawn={() => undefined} />
      </MvSection>

      <MvSection eyebrow="Dòng thời gian" title="Trải bài đã lưu">
        <TarotHistoryList filters={{}} onSelect={selectItem} />
      </MvSection>
    </MvPage>
  );
}
