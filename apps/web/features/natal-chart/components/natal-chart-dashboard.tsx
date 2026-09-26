'use client';

import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { BirthInputForm } from './birth-input-form';
import { NatalChartHistoryList } from './natal-chart-history-list';
import { NatalChartDetail } from './natal-chart-detail';
import { MvPage, MvSection } from '@/components/ui/mv-page';
import { Board04AstroMark } from './board04-astro-mark';
import { FEATURE_ART_ASSET } from '@/features/dashboard/components/home/production-assets';

const FEATURE_CARDS = [
  ['Chính xác', 'Dựa trên dữ liệu sinh và hệ thống tính toán thiên văn.'],
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
                Một lát cắt của bầu trời vào đúng ngày, giờ và nơi bạn sinh ra — với vị trí hành tinh, cung mọc, các nhà và góc hợp được tính từ dữ liệu thật.
              </p>
            </div>
            <a href="#natal-chart-form" className="self-start inline-flex h-11 items-center justify-center gap-2 rounded-md bg-insight px-4 text-body-md font-semibold text-canvas transition duration-fast hover:-translate-y-0.5 hover:bg-[#E6C980] active:translate-y-0 active:bg-[#C59B4F] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-insight motion-reduce:transform-none">
              Lập bản đồ sao của bạn
            </a>
          </div>
          <div className="relative mx-auto aspect-[4/3] w-full max-w-[520px] overflow-hidden rounded-xl border border-[#d5ad62]/20 bg-[#07111d]">
            <Image src={FEATURE_ART_ASSET.natal_chart} alt="Minh họa Bản đồ sao" fill priority sizes="(min-width: 1536px) 560px, (min-width: 768px) 45vw, calc(100vw - 40px)" className="object-cover object-center" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#06111d]/70 via-transparent to-transparent" />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-55"><Board04AstroMark compact /></div>
          </div>
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
