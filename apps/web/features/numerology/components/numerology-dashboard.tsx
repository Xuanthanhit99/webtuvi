'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { NumerologyForm } from './numerology-form';
import { NumerologyHistoryList } from './numerology-history-list';
import { NumerologyReadingDetail } from './numerology-reading-detail';

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
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-heading-lg text-text-primary">Numerology</h1>
        <p className="mt-2 text-body-sm text-text-secondary">
          A real, deterministic calculation from your full birth name and date of birth — no number is ever chosen or invented by
          AI. Every core number below comes with its own calculation steps, so you can see exactly how it was derived.
        </p>
      </div>

      <section aria-labelledby="numerology-form-heading">
        <h2 id="numerology-form-heading" className="mb-3 text-body-sm font-semibold text-text-secondary">
          Calculate
        </h2>
        <NumerologyForm />
      </section>

      <section aria-labelledby="numerology-history-heading">
        <h2 id="numerology-history-heading" className="mb-3 text-body-sm font-semibold text-text-secondary">
          History
        </h2>
        <NumerologyHistoryList filters={{}} onSelect={selectItem} />
      </section>
    </div>
  );
}
