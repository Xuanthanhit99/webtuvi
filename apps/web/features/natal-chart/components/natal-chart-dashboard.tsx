'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { BirthInputForm } from './birth-input-form';
import { NatalChartHistoryList } from './natal-chart-history-list';
import { NatalChartDetail } from './natal-chart-detail';

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
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-heading-lg text-text-primary">Natal Chart</h1>
        <p className="mt-2 text-body-sm text-text-secondary">
          A real, deterministic birth chart calculated from your exact birth date, time, and place — no placement is ever chosen or
          invented by AI. Your chart is calculated once and stays exactly the same each time you revisit it.
        </p>
      </div>

      <section aria-labelledby="natal-chart-form-heading">
        <h2 id="natal-chart-form-heading" className="mb-3 text-body-sm font-semibold text-text-secondary">
          Calculate your chart
        </h2>
        <BirthInputForm />
      </section>

      <section aria-labelledby="natal-chart-history-heading">
        <h2 id="natal-chart-history-heading" className="mb-3 text-body-sm font-semibold text-text-secondary">
          History
        </h2>
        <NatalChartHistoryList filters={{}} onSelect={selectItem} />
      </section>
    </div>
  );
}
