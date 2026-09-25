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
        title="Bản đồ này chưa có các nhà"
        description={
          chart.birthTimeKnown
            ? 'Các nhà phụ thuộc vào giờ sinh chính xác và không thể tính đáng tin cậy ở vĩ độ nơi sinh này.'
            : 'Các nhà cần giờ sinh chính xác. Vị trí hành tinh và cung hoàng đạo của bạn vẫn được tính đầy đủ ở trên.'
        }
      />
    );
  }

  return (
    <ul className="grid gap-2 tablet:grid-cols-2" aria-label="Các nhà">
      {chart.houses.map((house) => (
        <li key={house.number} className="flex items-center justify-between gap-2 rounded-md border border-[#d5ad62]/20 bg-[#071827] px-3 py-2">
          <span className="text-body-sm font-semibold text-text-primary">{houseLabel(house.number)}</span>
          <span className="text-body-sm text-text-secondary">
            {SIGN_LABELS[house.sign]} · {(house.cuspLongitude % 30).toFixed(1)}°
          </span>
        </li>
      ))}
    </ul>
  );
}
