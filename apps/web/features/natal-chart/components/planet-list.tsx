import type { NatalPlacementDto } from '@beaconvie/types';
import { Badge } from '@/components/ui/badge';
import { houseLabel, PLANET_GLYPHS, PLANET_LABELS, SIGN_LABELS } from '../labels';

/** Phase 17 — every calculated planet placement, in fixed classical order. This list (not just
 * the wheel) is the real, screen-reader-navigable equivalent of that visualization (Module 13
 * §20). Real data + fixed traditional meaning only — never AI-generated. */
export function PlanetList({ placements }: { placements: NatalPlacementDto[] }) {
  return (
    <ul className="flex flex-col gap-2" aria-label="Các hành tinh">
      {placements.map((placement) => (
        <li key={placement.body} className="flex flex-col gap-1 rounded-md border border-[#d5ad62]/20 bg-[#071827] p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span aria-hidden="true" className="text-body-lg text-[#efb96c]">
              {PLANET_GLYPHS[placement.body]}
            </span>
            <span className="text-body-sm font-semibold text-text-primary">{PLANET_LABELS[placement.body]}</span>
            <span className="text-body-sm text-text-secondary">
              tại {SIGN_LABELS[placement.sign]} · {placement.degreeInSign.toFixed(1)}°
            </span>
            {placement.house !== null && <Badge variant="neutral">{houseLabel(placement.house)}</Badge>}
            {placement.retrograde && <Badge variant="medium">Nghịch hành</Badge>}
          </div>
          <p className="text-body-sm text-text-secondary">{placement.meaning}</p>
        </li>
      ))}
    </ul>
  );
}
