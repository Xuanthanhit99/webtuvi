'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { NumerologyForm } from './numerology-form';
import { NumerologyHistoryList } from './numerology-history-list';
import { NumerologyReadingDetail } from './numerology-reading-detail';
import { MvPage, MvSection } from '@/components/ui/mv-page';
import { Button } from '@/components/ui/button';
import { Board04NumberMark } from './board04-number-mark';

const FEATURE_CARDS = [
  ['Chính xác', 'Phương pháp Pythagorean từ họ tên và ngày sinh.'],
  ['Toàn diện', 'Sáu chỉ số cốt lõi đã được backend hỗ trợ.'],
  ['Ứng dụng', 'Ý nghĩa truyền thống kèm bước tính minh bạch.'],
  ['Dễ hiểu', 'Từ tổng quan đến chi tiết trong cùng một luồng.'],
];

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
      <section className="relative overflow-hidden rounded-md border border-[#d5ad62]/30 bg-[#06111d] px-5 py-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] tablet:px-8 tablet:py-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(89,199,181,0.18),transparent_26%),radial-gradient(circle_at_78%_36%,rgba(213,173,98,0.16),transparent_28%),linear-gradient(180deg,rgba(13,35,42,0.62),rgba(4,12,22,0.94))]" />
        <div className="relative grid items-center gap-8 tablet:grid-cols-[1.05fr_0.95fr]">
          <div className="flex flex-col gap-5">
            <div>
              <p className="text-caption font-semibold uppercase text-[#8ddbd0]">Thần số học</p>
              <h1 className="mt-3 max-w-xl font-serif text-heading-xl text-text-primary tablet:text-display-sm">Những con số cốt lõi trong hồ sơ của bạn</h1>
              <p className="mt-4 max-w-2xl text-body-md text-text-secondary">
                Tính toán deterministic từ họ tên khai sinh và ngày sinh. Mỗi con số giữ lại bước tính để bạn biết kết quả đến từ đâu.
              </p>
            </div>
            <a href="#numerology-form" className="self-start">
              <Button variant="primary">Khám phá con số của bạn</Button>
            </a>
          </div>
          <Board04NumberMark />
        </div>
        <div className="relative mt-7 grid gap-3 tablet:grid-cols-4">
          {FEATURE_CARDS.map(([title, description]) => (
            <div key={title} className="rounded-md border border-[#d5ad62]/20 bg-[#071827]/75 p-4">
              <p className="text-body-sm font-semibold text-[#efb96c]">{title}</p>
              <p className="mt-1 text-caption text-text-secondary">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <MvSection eyebrow="Dữ liệu cá nhân" title="Tính thần số học">
        <div id="numerology-form" />
        <NumerologyForm />
      </MvSection>

      <MvSection eyebrow="Dòng thời gian" title="Hồ sơ đã lưu">
        <NumerologyHistoryList filters={{}} onSelect={selectItem} />
      </MvSection>
    </MvPage>
  );
}
