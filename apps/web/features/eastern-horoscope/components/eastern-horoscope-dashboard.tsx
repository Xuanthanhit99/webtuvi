'use client';

import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { EasternHoroscopeForm } from './eastern-horoscope-form';
import { EasternHoroscopeHistoryList } from './eastern-horoscope-history-list';
import { EasternHoroscopeDetail } from './eastern-horoscope-detail';
import { MvPage, MvSection } from '@/components/ui/mv-page';
import { HOME_BACKGROUND, HOME_DECOR } from '@/features/dashboard/components/home/production-assets';

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
      <header className="relative isolate overflow-hidden rounded-xl border border-[#d5ad62]/20 bg-[#0b1118] px-5 py-8 tablet:px-9 tablet:py-10">
        <Image src={HOME_BACKGROUND.journeyBanner} alt="" fill priority sizes="(min-width: 1536px) 1248px, (min-width: 1280px) calc(100vw - 288px), 100vw" className="-z-10 object-cover object-center opacity-24 tablet:opacity-28" />
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-[#0b1118] via-[#0b1118]/88 to-[#0b1118]/45" />
        <Image src={HOME_DECOR.moonPlanets} alt="" width={260} height={260} className="pointer-events-none absolute -right-8 -top-10 hidden h-64 w-64 object-contain opacity-45 tablet:block" />
        <div className="relative max-w-2xl">
          <p className="text-caption font-semibold uppercase tracking-[0.22em] text-[#d5ad62]">Ngũ Hành Phương Đông</p>
          <h1 className="mt-3 font-serif text-heading-xl leading-tight text-text-primary tablet:text-display-sm">Một lát cắt phương Đông khác với Tử Vi</h1>
          <p className="mt-4 text-body-md leading-relaxed text-text-secondary">Tính con giáp, ngũ hành và mối quan hệ vận khí năm từ ngày sinh bằng quy tắc xác định. Đây là một hệ phương Đông riêng, không phải lá số Tử Vi và không dùng AI để tạo ra các dữ kiện nền tảng.</p>
        </div>
      </header>

      <MvSection eyebrow="Ngày sinh" title="Khám phá bản mệnh">
        <EasternHoroscopeForm />
      </MvSection>

      <MvSection eyebrow="Đã lưu" title="Lịch sử">
        <EasternHoroscopeHistoryList filters={{}} onSelect={selectItem} />
      </MvSection>
    </MvPage>
  );
}
