'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { EasternHoroscopeForm } from './eastern-horoscope-form';
import { EasternHoroscopeHistoryList } from './eastern-horoscope-history-list';
import { EasternHoroscopeDetail } from './eastern-horoscope-detail';
import { MvPage, MvPageHeader, MvSection } from '@/components/ui/mv-page';

/**
 * `/discover/eastern-horoscope` — intro, birth-date form, reveal, and history, using the same
 * `?item=<id>` "open detail in place" pattern every other Discovery module in this product uses.
 */
export function EasternHoroscopeDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeId = searchParams.get('item');

  function selectItem(id: string | null) {
    router.replace(id ? `/discover/eastern-horoscope?item=${id}` : '/discover/eastern-horoscope', { scroll: false });
  }

  if (activeId) {
    return <EasternHoroscopeDetail id={activeId} onClose={() => selectItem(null)} />;
  }

  return (
    <MvPage>
      <MvPageHeader
        eyebrow="Ngũ Hành Phương Đông"
        title="Một lát cắt phương Đông khác với Tử Vi"
        description="Tính con giáp, ngũ hành và mối quan hệ vận khí năm từ ngày sinh bằng quy tắc xác định. Đây là một hệ phương Đông riêng, không phải lá số Tử Vi và không dùng AI để tạo ra các dữ kiện nền tảng."
      />

      <MvSection eyebrow="Ngày sinh" title="Khám phá bản mệnh">
        <EasternHoroscopeForm />
      </MvSection>

      <MvSection eyebrow="Đã lưu" title="Lịch sử">
        <EasternHoroscopeHistoryList filters={{}} onSelect={selectItem} />
      </MvSection>
    </MvPage>
  );
}
