import type { NatalChartDto } from '@beaconvie/types';
import { EmptyState } from '@/components/ui/empty-state';
import { houseLabel, SIGN_LABELS } from '../labels';

/** Phase 17 — the twelve houses, only rendered when actually calculated (Module 13 §14/§16: an
 * honest, plainly-explained "unavailable" state, never a fabricated table, when birth time is
 * unknown or the birth latitude is extreme). */
export function HouseList({ chart }: { chart: NatalChartDto }) {
  if (!chart.housesAvailable) {
    return (
      <EmptyState
        title="Houses aren’t available for this chart"
        description={
          chart.birthTimeKnown
            ? 'Houses depend on precise birth time and can’t be calculated reliably at this birth latitude.'
            : 'Houses depend on knowing your exact birth time. Your planets and signs are still fully calculated above.'
        }
      />
    );
  }

  return (
    <ul className="grid gap-2 tablet:grid-cols-2" aria-label="Houses">
      {chart.houses.map((house) => (
        <li key={house.number} className="flex items-center justify-between gap-2 rounded-md border border-border-subtle bg-surface px-3 py-2">
          <span className="text-body-sm font-semibold text-text-primary">{houseLabel(house.number)}</span>
          <span className="text-body-sm text-text-secondary">{SIGN_LABELS[house.sign]}</span>
        </li>
      ))}
    </ul>
  );
}
