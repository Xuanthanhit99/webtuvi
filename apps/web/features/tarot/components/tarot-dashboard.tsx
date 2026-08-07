'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { TarotDrawPanel } from './tarot-draw-panel';
import { TarotHistoryList } from './tarot-history-list';
import { TarotReadingDetail } from './tarot-reading-detail';

/**
 * `/discover/tarot` — deck intro, draw, reading result, and history, using the same `?item=<id>`
 * "open detail in place" pattern every other module in this product already uses (Memory/Insight/
 * Review/Goal).
 */
export function TarotDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeId = searchParams.get('item');

  function selectItem(id: string | null) {
    router.replace(id ? `/discover/tarot?item=${id}` : '/discover/tarot', { scroll: false });
  }

  if (activeId) {
    return <TarotReadingDetail id={activeId} onClose={() => selectItem(null)} />;
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-heading-lg text-text-primary">Tarot</h1>
        <p className="mt-2 text-body-sm text-text-secondary">
          A real, traditional 78-card deck, drawn deterministically — no card is ever chosen or invented by AI. The
          interpretation that follows only ever reflects on the cards that were actually drawn, and can bridge into a
          conversation with your Companion if you want to go deeper.
        </p>
      </div>

      <section aria-labelledby="tarot-draw-heading">
        <h2 id="tarot-draw-heading" className="mb-3 text-body-sm font-semibold text-text-secondary">
          Draw
        </h2>
        <TarotDrawPanel onDrawn={() => undefined} />
      </section>

      <section aria-labelledby="tarot-history-heading">
        <h2 id="tarot-history-heading" className="mb-3 text-body-sm font-semibold text-text-secondary">
          History
        </h2>
        <TarotHistoryList filters={{}} onSelect={selectItem} />
      </section>
    </div>
  );
}
