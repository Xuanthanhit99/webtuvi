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
        description="A real, deterministic Chinese Zodiac and Five Elements calculation from your birth date — no sign, element, or year relationship is ever chosen or invented by AI. Not Vietnamese Tử Vi Lá Số, a separate module."
      />

      <MvSection eyebrow="Input" title="Reveal">
        <EasternHoroscopeForm />
      </MvSection>

      <MvSection eyebrow="Saved" title="History">
        <EasternHoroscopeHistoryList filters={{}} onSelect={selectItem} />
      </MvSection>
    </MvPage>
  );
}
