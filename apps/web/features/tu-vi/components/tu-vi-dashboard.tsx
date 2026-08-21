'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { TuViForm } from './tu-vi-form';
import { TuViHistoryList } from './tu-vi-history-list';
import { TuViDetail } from './tu-vi-detail';

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
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-heading-lg text-text-primary">Tử Vi Lá Số</h1>
        <p className="mt-2 text-body-sm text-text-secondary">
          A real, deterministic Vietnamese Tử Vi Đẩu Số chart calculated from your birth date, time, and sex, built from a verified
          traditional ruleset (VDTTL-1956) — no palace, star, or transformation is ever chosen or invented by AI. Not the same as Ngũ
          Hành Phương Đông (Chinese Zodiac / Five Elements), a separate module.
        </p>
      </div>

      <section aria-labelledby="tu-vi-form-heading">
        <h2 id="tu-vi-form-heading" className="mb-3 text-body-sm font-semibold text-text-secondary">
          Reveal
        </h2>
        <TuViForm />
      </section>

      <section aria-labelledby="tu-vi-history-heading">
        <h2 id="tu-vi-history-heading" className="mb-3 text-body-sm font-semibold text-text-secondary">
          History
        </h2>
        <TuViHistoryList filters={{}} onSelect={selectItem} />
      </section>
    </div>
  );
}
