'use client';

import type { TuViChartDto } from '@beaconvie/types';
import { DIGNITY_SHORT_LABEL } from '../labels';

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

  // Real cross-reference for the current (or, absent one, the earliest listed) year's palace —
  // the same stars already placed on this chart, filtered by that year's own palace branch,
  // mirroring TuViDaiVanTimeline's own real-data-only pattern.
  const detailEntry = chart.currentTieuHan ?? chart.nearbyTieuHan[0]!;
  const mainStars = chart.mainStars.filter((s) => s.position === detailEntry.palace);
  const auxiliaryStars = chart.auxiliaryStars.filter((s) => s.position === detailEntry.palace);

  return (
    <section aria-labelledby="tu-vi-tieu-han-heading" className="rounded-lg border border-[rgba(213,173,98,0.18)] bg-surface p-4">
      <h3 id="tu-vi-tieu-han-heading" className="mb-3 font-display text-body-md font-semibold text-text-primary">
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
                  isCurrent ? 'border-insight bg-insight/10' : 'border-[rgba(213,173,98,0.14)]'
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

      <div className="mt-3 rounded-md border border-[rgba(213,173,98,0.18)] bg-surface-raised p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="font-display text-body-lg font-semibold text-text-primary">Tiểu Hạn năm {detailEntry.lunarYear}</p>
          {chart.currentTieuHan && <span className="rounded-sm bg-insight/15 px-2 py-0.5 text-caption font-semibold text-insight">Hiện tại</span>}
        </div>
        <p className="mt-1 text-body-sm text-text-secondary">
          {detailEntry.tuoi} tuổi · Cung tại {detailEntry.palace}
        </p>

        <div className="mt-4 grid gap-3 tablet:grid-cols-2">
          <div>
            <p className="text-caption font-semibold uppercase tracking-[0.12em] text-text-tertiary">Chính tinh</p>
            {mainStars.length > 0 ? (
              <ul className="mt-1.5 flex flex-col gap-1">
                {mainStars.map(({ star, dignity }) => (
                  <li key={star} className="flex items-center gap-1.5 text-body-sm text-text-primary">
                    {star}
                    <span className="rounded-sm bg-insight/15 px-1 py-0.5 text-[0.6rem] font-semibold text-insight">{DIGNITY_SHORT_LABEL[dignity]}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1.5 text-body-sm text-text-tertiary">Không có chính tinh tại cung này.</p>
            )}
          </div>
          <div>
            <p className="text-caption font-semibold uppercase tracking-[0.12em] text-text-tertiary">Phụ tinh</p>
            {auxiliaryStars.length > 0 ? (
              <ul className="mt-1.5 flex flex-wrap gap-x-2 gap-y-1 text-body-sm text-text-secondary">
                {auxiliaryStars.map(({ star }) => (
                  <li key={star}>{star}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-1.5 text-body-sm text-text-tertiary">Không có phụ tinh tại cung này.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
