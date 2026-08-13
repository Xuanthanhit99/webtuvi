import type { NatalChartDto } from '@beaconvie/types';
import { PLANET_GLYPHS, SIGN_LABELS } from '../labels';

/** Phase 17/18 — the highest-priority summary: Sun, Moon, Rising. Real calculated values only,
 * shown before any other chart detail (Module 13 §4's progressive-disclosure order). */
export function BigThreeSummary({ chart }: { chart: NatalChartDto }) {
  const sun = chart.placements.find((p) => p.body === 'sun');
  const moon = chart.placements.find((p) => p.body === 'moon');

  const items = [
    { label: 'Sun', glyph: PLANET_GLYPHS.sun, sign: sun ? SIGN_LABELS[sun.sign] : null },
    { label: 'Moon', glyph: PLANET_GLYPHS.moon, sign: moon ? SIGN_LABELS[moon.sign] : null },
    { label: 'Rising', glyph: '↑', sign: chart.ascendant ? SIGN_LABELS[chart.ascendant.sign] : null },
  ];

  return (
    <div className="grid grid-cols-3 gap-3" role="group" aria-label="Big Three">
      {items.map((item) => (
        <div key={item.label} className="flex flex-col items-center gap-1 rounded-md border border-border-subtle bg-surface p-4 text-center">
          <span aria-hidden="true" className="text-heading-md text-insight">
            {item.glyph}
          </span>
          <span className="text-caption uppercase tracking-wide text-text-secondary">{item.label}</span>
          {item.sign ? (
            <span className="text-body-md font-semibold text-text-primary">{item.sign}</span>
          ) : (
            <span className="text-body-sm text-text-disabled">Unavailable</span>
          )}
        </div>
      ))}
    </div>
  );
}
