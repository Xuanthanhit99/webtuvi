'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { BirthInputForm } from './birth-input-form';
import { NatalChartHistoryList } from './natal-chart-history-list';
import { NatalChartDetail } from './natal-chart-detail';
import { MvPage, MvPageHeader, MvSection } from '@/components/ui/mv-page';

/**
 * `/discover/natal-chart` — intro, birth-data form, reveal, and history, using the same
 * `?item=<id>` "open detail in place" pattern every other module in this product already uses
 * (Memory/Insight/Review/Goal/Tarot/Numerology).
 */
export function NatalChartDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeId = searchParams.get('item');

  function selectItem(id: string | null) {
    router.replace(id ? `/discover/natal-chart?item=${id}` : '/discover/natal-chart', { scroll: false });
  }

  if (activeId) {
    return <NatalChartDetail id={activeId} onClose={() => selectItem(null)} />;
  }

  return (
    <MvPage>
      <MvPageHeader
        eyebrow="Bản đồ sao"
        title="Bầu trời tại khoảnh khắc bạn sinh ra"
        description="Bản đồ sao được tính từ ngày, giờ và nơi sinh thật. Mặt Trời, Mặt Trăng, ASC, nhà và góc chiếu đều là dữ liệu từ engine, không phải minh họa trang trí."
      />

      <MvSection eyebrow="Dữ liệu sinh" title="Tạo bản đồ sao">
        <BirthInputForm />
      </MvSection>

      <MvSection eyebrow="Dòng thời gian" title="Bản đồ đã lưu">
        <NatalChartHistoryList filters={{}} onSelect={selectItem} />
      </MvSection>
    </MvPage>
  );
}
