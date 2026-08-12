import { Sun, ChevronRight } from 'lucide-react';
import { mvSpotlight } from '../data/mock-dashboard';

export function MvSpotlightCard() {
  return (
    <div className="rounded-xl border border-mv-border bg-mv-elevated p-5">
      <p className="text-caption font-semibold uppercase tracking-wider text-mv-gold">Điều đáng chú ý</p>
      <div className="mt-3 flex gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-mv-gold/15">
          <Sun className="h-4 w-4 text-mv-gold" aria-hidden="true" />
        </span>
        <p className="text-body-sm text-mv-text-secondary">{mvSpotlight.title}</p>
      </div>
      <button
        type="button"
        className="mt-4 inline-flex items-center gap-1 text-body-sm font-medium text-mv-violet-secondary transition-colors duration-fast hover:text-mv-gold"
      >
        Xem chi tiết
        <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}
