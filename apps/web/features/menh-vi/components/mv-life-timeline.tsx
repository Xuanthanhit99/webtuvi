import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { mvLifeTimeline } from '../data/mock-dashboard';

export function MvLifeTimeline() {
  return (
    <div className="rounded-xl border border-mv-border bg-mv-elevated p-5">
      <p className="text-caption font-semibold uppercase tracking-wider text-mv-gold">Bản đồ cuộc đời</p>
      <p className="mt-1 text-body-sm text-mv-text-secondary">Các cột mốc quan trọng</p>

      <div className="relative mt-6 flex items-start justify-between">
        <div className="absolute left-0 right-0 top-[7px] h-px bg-mv-border" />
        {mvLifeTimeline.map((point) => (
          <div key={point.year} className="relative flex flex-col items-center gap-2 text-center">
            <span
              className={cn(
                'rounded-full border-2',
                point.current
                  ? 'h-4 w-4 border-mv-gold bg-mv-gold shadow-mv-glow-gold'
                  : 'h-3.5 w-3.5 border-mv-border bg-mv-elevated',
              )}
            />
            <span
              className={cn(
                'text-caption',
                point.current ? 'rounded-full bg-mv-gold/15 px-2 py-0.5 font-semibold text-mv-gold' : 'text-mv-text-secondary',
              )}
            >
              {point.label}
            </span>
            <span className={cn('text-caption', point.current ? 'text-mv-text' : 'text-mv-text-secondary/70')}>
              {point.year}
            </span>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="mt-6 inline-flex items-center gap-1 text-body-sm font-medium text-mv-violet-secondary transition-colors duration-fast hover:text-mv-gold"
      >
        Xem chi tiết
        <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}
