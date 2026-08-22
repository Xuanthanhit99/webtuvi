'use client';

import type { TuViChartDto } from '@beaconvie/types';

/**
 * Time Cycles pass — Tiểu Hạn (annual cycle) year navigation. `nearbyTieuHan` is a server-computed
 * ±2-year window (never re-derived client-side — the frontend has no palace-calculation logic of
 * its own). Three honest states, in order of priority:
 *
 * 1. `tieuHanStart` is null — chart calculated before this feature shipped: render nothing.
 * 2. `tieuHanStart` exists but `nearbyTieuHan` is empty — this person's current tuổi is under 13
 *    (the separate, unimplemented child Tiểu Hạn system): render an honest unavailable state,
 *    never a fabricated result.
 * 3. Otherwise: render the real year window.
 */
export function TuViTieuHanYearNav({ chart }: { chart: TuViChartDto }) {
  if (!chart.tieuHanStart) return null;

  if (chart.nearbyTieuHan.length === 0) {
    return (
      <section aria-labelledby="tu-vi-tieu-han-heading" className="rounded-lg border border-border-subtle bg-surface p-4">
        <h3 id="tu-vi-tieu-han-heading" className="text-body-sm font-semibold text-text-primary">
          Tiểu Hạn — chu kỳ theo năm
        </h3>
        <p className="mt-2 text-caption text-text-tertiary">Tiểu Hạn áp dụng từ 13 tuổi trở lên. Phần này sẽ hiển thị khi đến tuổi phù hợp.</p>
      </section>
    );
  }

  return (
    <section aria-labelledby="tu-vi-tieu-han-heading" className="rounded-lg border border-border-subtle bg-surface p-4">
      <h3 id="tu-vi-tieu-han-heading" className="mb-3 text-body-sm font-semibold text-text-primary">
        Tiểu Hạn — chu kỳ theo năm
      </h3>

      <ul className="flex flex-wrap gap-1.5" aria-label="Các năm gần hiện tại">
        {chart.nearbyTieuHan.map((entry) => {
          const isCurrent = entry.tuoi === chart.currentTieuHan?.tuoi;
          return (
            <li key={entry.tuoi}>
              <div
                aria-current={isCurrent ? 'true' : undefined}
                className={`flex min-h-11 flex-col items-center justify-center rounded-md border px-3 py-1 text-center ${
                  isCurrent ? 'border-insight bg-insight/10' : 'border-border-subtle'
                }`}
              >
                <span className="text-body-sm font-medium text-text-primary">{entry.lunarYear}</span>
                <span className="text-caption text-text-tertiary">
                  {entry.tuoi} tuổi{isCurrent ? ' · hiện tại' : ''}
                </span>
                <span className="text-caption text-text-secondary">{entry.palace}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
