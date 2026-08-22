'use client';

import { useState } from 'react';
import type { TuViChartDto } from '@beaconvie/types';
import { PALACE_ROLE_LABELS_EN } from '../labels';

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

  return (
    <section aria-labelledby="tu-vi-dai-van-heading" className="rounded-lg border border-border-subtle bg-surface p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 id="tu-vi-dai-van-heading" className="text-body-sm font-semibold text-text-primary">
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
                isSelected ? 'border-insight bg-insight/10 text-text-primary' : isCurrent ? 'border-insight/50 text-text-primary' : 'border-border-subtle text-text-secondary hover:border-insight/40'
              }`}
            >
              {cycle.ageStart}–{cycle.ageEnd}
              {isCurrent && <span className="ml-1 text-caption text-insight">•</span>}
            </button>
          );
        })}
      </div>

      <div className="mt-3 rounded-md border border-border-subtle bg-surface-raised p-3">
        <dl className="grid grid-cols-2 gap-2 text-body-sm">
          <dt className="text-text-secondary">Độ tuổi</dt>
          <dd className="text-text-primary">{selected.ageStart}–{selected.ageEnd} tuổi</dd>
          <dt className="text-text-secondary">Cung</dt>
          <dd className="text-text-primary">
            {selected.role} <span className="text-text-tertiary">({PALACE_ROLE_LABELS_EN[selected.role]})</span>
          </dd>
          <dt className="text-text-secondary">Vị trí</dt>
          <dd className="text-text-primary">{selected.position}</dd>
        </dl>
        <p className="mt-2 text-caption text-text-tertiary">Giai đoạn 10 năm này ứng với cung {selected.role} trên lá số — được tính từ Cục và giới tính, không phải AI lựa chọn.</p>
      </div>
    </section>
  );
}
