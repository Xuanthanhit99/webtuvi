'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { BirthInputForm } from './birth-input-form';
import { NatalChartHistoryList } from './natal-chart-history-list';
import { NatalChartDetail } from './natal-chart-detail';
import { MvPage, MvSection } from '@/components/ui/mv-page';
import { Button } from '@/components/ui/button';
import { Board04AstroMark } from './board04-astro-mark';

const FEATURE_CARDS = [
  ['Chính xác', 'Dựa trên dữ liệu sinh và engine thiên văn học.'],
  ['Cá nhân hóa', 'Vị trí hành tinh, nhà và góc hợp theo hồ sơ của bạn.'],
  ['Dễ hiểu', 'Tầng thông tin rõ ràng từ tổng quan đến chi tiết.'],
  ['Bảo mật', 'Bản đồ được lưu trong tài khoản của bạn.'],
];

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
      <section className="relative overflow-hidden rounded-md border border-[#d5ad62]/30 bg-[#06111d] px-5 py-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] tablet:px-8 tablet:py-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(213,173,98,0.18),transparent_28%),radial-gradient(circle_at_78%_30%,rgba(89,199,181,0.14),transparent_26%),linear-gradient(180deg,rgba(18,29,51,0.58),rgba(4,12,22,0.94))]" />
        <div className="relative grid items-center gap-8 tablet:grid-cols-[1.05fr_0.95fr]">
          <div className="flex flex-col gap-5">
            <div>
              <p className="text-caption font-semibold uppercase text-[#8ddbd0]">Bản đồ sao</p>
              <h1 className="mt-3 max-w-xl font-serif text-heading-xl text-text-primary tablet:text-display-sm">Bầu trời tại khoảnh khắc bạn sinh ra</h1>
              <p className="mt-4 max-w-2xl text-body-md text-text-secondary">
                Bản đồ sao được tính từ ngày, giờ và nơi sinh thật. Mặt Trời, Mặt Trăng, ASC, nhà và góc chiếu đều là dữ liệu từ engine,
                không phải minh họa trang trí.
              </p>
            </div>
            <a href="#natal-chart-form" className="self-start">
              <Button variant="primary">Lập bản đồ sao của bạn</Button>
            </a>
          </div>
          <Board04AstroMark />
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

      <MvSection eyebrow="Dữ liệu sinh" title="Tạo bản đồ sao">
        <div id="natal-chart-form" />
        <BirthInputForm />
      </MvSection>

      <MvSection eyebrow="Dòng thời gian" title="Bản đồ đã lưu">
        <NatalChartHistoryList filters={{}} onSelect={selectItem} />
      </MvSection>
    </MvPage>
  );
}
