'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { TuViForm } from './tu-vi-form';
import { TuViHero } from './tu-vi-hero';
import { TuViHistoryList } from './tu-vi-history-list';
import { TuViDetail } from './tu-vi-detail';
import { TuViTrustSection } from './tu-vi-trust-section';
import { MvPage, MvSection } from '@/components/ui/mv-page';

/**
 * `/discover/tu-vi` — intro, birth-data form, reveal, and history, using the same `?item=<id>`
 * "open detail in place" pattern every other Discovery module in this product uses. Vietnamese Tử
 * Vi Đẩu Số is a separate, distinct system from Ngũ Hành Phương Đông (Eastern Horoscope) — this
 * page never links to or mentions that module's routes/terms, and vice versa.
 */
export function TuViDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeId = searchParams.get('item');

  function selectItem(id: string | null) {
    router.replace(id ? `/discover/tu-vi?item=${id}` : '/discover/tu-vi', { scroll: false });
  }

  if (activeId) {
    return <TuViDetail id={activeId} onClose={() => selectItem(null)} />;
  }

  return (
    <MvPage>
      <TuViHero />

      <TuViTrustSection context="tổng quan" />

      <div id="tu-vi-form" className="scroll-mt-24">
        <MvSection eyebrow="Nhập dữ liệu sinh" title="Lập lá số">
          <TuViForm />
        </MvSection>
      </div>

      <div id="tu-vi-history" className="scroll-mt-24">
        <MvSection eyebrow="Dòng thời gian" title="Lá số đã lưu">
          <TuViHistoryList filters={{}} onSelect={selectItem} />
        </MvSection>
      </div>
    </MvPage>
  );
}
