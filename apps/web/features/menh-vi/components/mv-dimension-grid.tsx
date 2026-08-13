import { Heart, Briefcase, Coins, Moon } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { mvDimensionDetails } from '../data/mock-dashboard';

const META: Record<string, { icon: LucideIcon; accent: string; bg: string }> = {
  love: { icon: Heart, accent: 'text-mv-rose', bg: 'bg-mv-rose/15' },
  career: { icon: Briefcase, accent: 'text-mv-violet-secondary', bg: 'bg-mv-violet/15' },
  wealth: { icon: Coins, accent: 'text-mv-gold', bg: 'bg-mv-gold/15' },
  inner: { icon: Moon, accent: 'text-mv-violet-secondary', bg: 'bg-mv-violet/15' },
};

/** Four separate reference-style dimension cards — own border/bg each, per reference. */
export function MvDimensionGrid() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {mvDimensionDetails.map((dim) => {
        const meta = META[dim.key]!;
        return (
          <button
            key={dim.key}
            type="button"
            className="rounded-xl border border-mv-border bg-mv-elevated p-4 text-left transition-colors duration-fast hover:border-mv-gold/30"
          >
            <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${meta.bg}`}>
              <meta.icon className={`h-4 w-4 ${meta.accent}`} aria-hidden="true" />
            </span>
            <p className="mt-2 text-body-sm font-medium text-mv-text">{dim.label}</p>
            <p className="text-body-sm">
              <span className="font-semibold text-mv-text">{dim.score}</span>
              <span className="text-mv-text-secondary">/100</span>
            </p>
            <p className="mt-1 truncate text-caption text-mv-text-secondary">{dim.note}</p>
          </button>
        );
      })}
    </div>
  );
}
