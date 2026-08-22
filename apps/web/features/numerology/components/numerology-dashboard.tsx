'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { NumerologyForm } from './numerology-form';
import { NumerologyHistoryList } from './numerology-history-list';
import { NumerologyReadingDetail } from './numerology-reading-detail';
import { MvPage, MvPageHeader, MvSection } from '@/components/ui/mv-page';

/**
 * `/discover/numerology` — intro, calculation form, reveal, and history, using the same
 * `?item=<id>` "open detail in place" pattern every other module in this product already uses
 * (Memory/Insight/Review/Goal/Tarot).
 */
export function NumerologyDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeId = searchParams.get('item');

  function selectItem(id: string | null) {
    router.replace(id ? `/discover/numerology?item=${id}` : '/discover/numerology', { scroll: false });
  }

  if (activeId) {
    return <NumerologyReadingDetail id={activeId} onClose={() => selectItem(null)} />;
  }

  return (
    <MvPage>
      <MvPageHeader
        eyebrow="Thần số học"
        title="Những con số cốt lõi trong hồ sơ của bạn"
        description="Tính toán deterministic từ họ tên khai sinh và ngày sinh. Mỗi con số giữ lại bước tính để bạn biết kết quả đến từ đâu."
      />

      <MvSection eyebrow="Dữ liệu cá nhân" title="Tính thần số học">
        <NumerologyForm />
      </MvSection>

      <MvSection eyebrow="Dòng thời gian" title="Hồ sơ đã lưu">
        <NumerologyHistoryList filters={{}} onSelect={selectItem} />
      </MvSection>
    </MvPage>
  );
}
