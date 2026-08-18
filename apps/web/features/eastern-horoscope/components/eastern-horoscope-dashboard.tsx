'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { EasternHoroscopeForm } from './eastern-horoscope-form';
import { EasternHoroscopeHistoryList } from './eastern-horoscope-history-list';
import { EasternHoroscopeDetail } from './eastern-horoscope-detail';

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
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-heading-lg text-text-primary">Ngũ Hành Phương Đông</h1>
        <p className="mt-2 text-body-sm text-text-secondary">
          A real, deterministic Chinese Zodiac and Five Elements calculation from your birth date — no sign, element, or year
          relationship is ever chosen or invented by AI. Not Vietnamese Tử Vi Lá Số, a separate future module.
        </p>
      </div>

      <section aria-labelledby="eastern-horoscope-form-heading">
        <h2 id="eastern-horoscope-form-heading" className="mb-3 text-body-sm font-semibold text-text-secondary">
          Reveal
        </h2>
        <EasternHoroscopeForm />
      </section>

      <section aria-labelledby="eastern-horoscope-history-heading">
        <h2 id="eastern-horoscope-history-heading" className="mb-3 text-body-sm font-semibold text-text-secondary">
          History
        </h2>
        <EasternHoroscopeHistoryList filters={{}} onSelect={selectItem} />
      </section>
    </div>
  );
}
