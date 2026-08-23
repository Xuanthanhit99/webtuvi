'use client';

import { useState } from 'react';
import type { TuViChartDto } from '@beaconvie/types';
import { DIGNITY_SHORT_LABEL, PALACE_ROLE_LABELS_EN } from '../labels';

/**
 * Time Cycles pass — Đại Vận (10-year life cycles) timeline. Every value rendered here comes
 * directly from the already-computed, already-tested `TuViChartDto.daiVan` array (never recomputed
 * client-side) and `currentDaiVan` (computed server-side, fresh on every read, from today's real
 * date — never a client-side date calculation). Renders nothing for a chart calculated before this
 * feature shipped (`daiVan` empty) rather than showing a broken or misleading section.
 */
export function TuViDaiVanTimeline({ chart }: { chart: TuViChartDto }) {
  const currentIndex = chart.currentDaiVan?.index ?? chart.daiVan[0]?.index ?? 0;
  const [selectedIndex, setSelectedIndex] = useState(currentIndex);

  if (chart.daiVan.length === 0) return null;

  const selected = chart.daiVan.find((c) => c.index === selectedIndex) ?? chart.daiVan[0]!;
  const isSelectedCurrent = selected.index === chart.currentDaiVan?.index;
  // Real cross-reference, not fabricated: the stars in the selected cycle's palace are the same
  // stars already placed on this chart — filtered by the cycle's own `position` branch, exactly
  // like TuViPalaceGrid's own per-palace projection.
  const mainStars = chart.mainStars.filter((s) => s.position === selected.position);
  const auxiliaryStars = chart.auxiliaryStars.filter((s) => s.position === selected.position);

  return (
    <section aria-labelledby="tu-vi-dai-van-heading" className="rounded-lg border border-[rgba(213,173,98,0.18)] bg-surface p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 id="tu-vi-dai-van-heading" className="font-display text-body-md font-semibold text-text-primary">
          Đại Vận — chu kỳ 10 năm
        </h3>
        {chart.currentDaiVan && <span className="text-caption text-text-tertiary">Hiện tại: {chart.currentDaiVan.ageStart}–{chart.currentDaiVan.ageEnd} tuổi</span>}
      </div>

      <div role="tablist" aria-label="Chọn giai đoạn Đại Vận" className="flex gap-1.5 overflow-x-auto pb-1">
        {chart.daiVan.map((cycle) => {
          const isCurrent = cycle.index === chart.currentDaiVan?.index;
          const isSelected = cycle.index === selectedIndex;
          return (
            <button
              key={cycle.index}
              type="button"
              role="tab"
              aria-selected={isSelected}
              aria-current={isCurrent ? 'true' : undefined}
              onClick={() => setSelectedIndex(cycle.index)}
              className={`min-h-11 shrink-0 rounded-md border px-3 text-body-sm font-medium transition-colors duration-fast ${
                isSelected ? 'border-insight bg-insight/10 text-text-primary' : isCurrent ? 'border-insight/50 text-text-primary' : 'border-[rgba(213,173,98,0.14)] text-text-secondary hover:border-insight/40'
              }`}
            >
              {cycle.ageStart}–{cycle.ageEnd}
              {isCurrent && <span className="ml-1 text-caption text-insight">•</span>}
            </button>
          );
        })}
      </div>

      <div className="mt-3 rounded-md border border-[rgba(213,173,98,0.18)] bg-surface-raised p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="font-display text-heading-md font-semibold text-text-primary">
            Đại Vận {selected.ageStart} - {selected.ageEnd} <span className="text-body-sm font-normal text-text-tertiary">tuổi</span>
          </p>
          {isSelectedCurrent && <span className="rounded-sm bg-insight/15 px-2 py-0.5 text-caption font-semibold text-insight">Hiện tại</span>}
        </div>
        <p className="mt-1 text-body-sm text-text-secondary">
          Cung {selected.role} <span className="text-text-tertiary">({PALACE_ROLE_LABELS_EN[selected.role]})</span> tại {selected.position}
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

        <p className="mt-4 border-t border-[rgba(213,173,98,0.14)] pt-3 text-caption text-text-tertiary">
          Giai đoạn 10 năm này ứng với cung {selected.role} trên lá số — được tính từ Cục và giới tính, không phải AI lựa chọn.
        </p>
      </div>
    </section>
  );
}
