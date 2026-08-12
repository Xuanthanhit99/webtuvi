import { ChevronRight } from 'lucide-react';
import { mvCompatibility } from '../data/mock-dashboard';

const RADIUS = 42;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function MvCompatibilityCard() {
  const offset = CIRCUMFERENCE * (1 - mvCompatibility.score / 100);

  return (
    <div className="flex flex-col items-center rounded-xl border border-mv-border bg-mv-elevated p-5 text-center">
      <p className="text-caption font-semibold uppercase tracking-wider text-mv-gold">Tương hợp của bạn</p>

      <div className="relative mt-4 flex items-center justify-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-full border border-mv-border bg-mv-surface text-body-sm font-semibold text-mv-text">
          {mvCompatibility.you.name[0]}
        </span>

        <div className="relative h-20 w-20">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            <circle cx="50" cy="50" r={RADIUS} fill="none" stroke="#332F52" strokeWidth="6" opacity="0.3" />
            <circle
              cx="50"
              cy="50"
              r={RADIUS}
              fill="none"
              stroke="#C98BA0"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={offset}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center font-display text-heading-md text-mv-text">
            {mvCompatibility.score}%
          </span>
        </div>

        <span className="flex h-11 w-11 items-center justify-center rounded-full border border-mv-border bg-mv-surface text-body-sm font-semibold text-mv-text">
          {mvCompatibility.partner.name[0]}
        </span>
      </div>

      <p className="mt-3 text-body-sm text-mv-text">
        {mvCompatibility.you.name} <span className="text-mv-text-secondary">×</span> {mvCompatibility.partner.name}
      </p>
      <p className="text-caption text-mv-rose">{mvCompatibility.label}</p>

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
