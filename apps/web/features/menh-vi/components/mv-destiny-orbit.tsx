import { Heart, Briefcase, Coins, Moon } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { mvEnergyToday } from '../data/mock-dashboard';

const DIMENSION_META: Record<string, { icon: LucideIcon; accent: string; bg: string }> = {
  love: { icon: Heart, accent: 'text-mv-rose', bg: 'bg-mv-rose/15' },
  career: { icon: Briefcase, accent: 'text-mv-violet-secondary', bg: 'bg-mv-violet/15' },
  wealth: { icon: Coins, accent: 'text-mv-gold', bg: 'bg-mv-gold/15' },
  inner: { icon: Moon, accent: 'text-mv-violet-secondary', bg: 'bg-mv-violet/15' },
};

const CORNER_CLASSES = [
  'left-0 top-0 tablet:top-4', // love — top-left
  'right-0 top-0 tablet:top-4', // career — top-right
  'left-0 bottom-0 tablet:bottom-4', // wealth — bottom-left
  'right-0 bottom-0 tablet:bottom-4', // inner — bottom-right
];

// Short spokes from the outer ring to each corner chip, at the four diagonal angles — a visible
// thread tying the four dimensions back to the orbit itself, not just floating badges.
const CONNECTORS = [
  { x1: 94, y1: 94, x2: 76, y2: 76 }, // NW — love
  { x1: 306, y1: 94, x2: 324, y2: 76 }, // NE — career
  { x1: 94, y1: 306, x2: 76, y2: 324 }, // SW — wealth
  { x1: 306, y1: 306, x2: 324, y2: 324 }, // SE — inner
];

/**
 * The signature Mệnh Vi visual: a celestial orbit around today's energy score, with four
 * dimension chips at the corners, visually threaded to the rings via short connector spokes.
 * Pure SVG/CSS — rotation is slow (48s/64s tokens) and respects prefers-reduced-motion globally.
 */
export function MvDestinyOrbit() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[228px] tablet:max-w-[360px] desktop:max-w-[470px]">
      {/* Radial lighting behind the orbit — reinforces it as the hero's light source. */}
      <div
        className="pointer-events-none absolute inset-[8%] rounded-full opacity-80"
        style={{ background: 'radial-gradient(circle, rgba(119,101,255,0.16) 0%, transparent 70%)' }}
        aria-hidden="true"
      />
      {CORNER_CLASSES.map((position, i) => {
        const dim = mvEnergyToday.dimensions[i]!;
        const meta = DIMENSION_META[dim.key]!;
        return (
          <div
            key={dim.key}
            className={`absolute z-10 flex items-center gap-2 rounded-xl border border-mv-border bg-mv-elevated/80 px-2.5 py-1.5 backdrop-blur-sm tablet:px-3 tablet:py-2 desktop:px-3.5 desktop:py-2.5 ${position}`}
          >
            <span className={`flex h-6 w-6 items-center justify-center rounded-full tablet:h-7 tablet:w-7 desktop:h-8 desktop:w-8 ${meta.bg}`}>
              <meta.icon className={`h-3 w-3 tablet:h-3.5 tablet:w-3.5 desktop:h-4 desktop:w-4 ${meta.accent}`} aria-hidden="true" />
            </span>
            <span className="leading-tight">
              <span className="block text-[10px] text-mv-text-secondary tablet:text-caption">{dim.label}</span>
              <span className="block text-caption font-semibold text-mv-text tablet:text-body-sm desktop:text-body-md">{dim.score}</span>
            </span>
          </div>
        );
      })}

      <svg viewBox="0 0 400 400" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <circle cx="200" cy="200" r="175" fill="none" stroke="#D9BC78" strokeOpacity="0.08" strokeWidth="1.5" />
        <circle cx="200" cy="200" r="150" fill="none" stroke="#D9BC78" strokeOpacity="0.16" strokeWidth="1.5" />
        <g className="origin-center animate-mv-orbit-slow" style={{ transformOrigin: '200px 200px' }}>
          <circle
            cx="200"
            cy="200"
            r="120"
            fill="none"
            stroke="#7765FF"
            strokeOpacity="0.32"
            strokeWidth="1.5"
            strokeDasharray="2 10"
          />
          <circle cx="320" cy="200" r="3.5" fill="#9A83FF" />
          <circle cx="80" cy="200" r="2" fill="#9A83FF" fillOpacity="0.6" />
        </g>
        <g className="origin-center animate-mv-orbit-slower" style={{ transformOrigin: '200px 200px' }}>
          <circle cx="200" cy="200" r="95" fill="none" stroke="#D9BC78" strokeOpacity="0.32" strokeWidth="1.5" />
          <circle cx="200" cy="105" r="3" fill="#D9BC78" />
          <circle cx="200" cy="295" r="2" fill="#D9BC78" fillOpacity="0.6" />
        </g>

        {CONNECTORS.map((c, i) => (
          <line
            key={i}
            x1={c.x1}
            y1={c.y1}
            x2={c.x2}
            y2={c.y2}
            stroke="#D9BC78"
            strokeOpacity="0.35"
            strokeWidth="1"
            strokeLinecap="round"
          />
        ))}
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <div className="flex h-[118px] w-[118px] flex-col items-center justify-center rounded-full shadow-mv-glow-violet tablet:h-[170px] tablet:w-[170px] desktop:h-[210px] desktop:w-[210px]">
          <span className="text-[9px] font-semibold uppercase tracking-widest text-mv-gold/90 tablet:text-caption">
            Năng lượng hôm nay
          </span>
          <span className="font-display text-[2.5rem] leading-none text-mv-text tablet:text-[3.5rem] desktop:text-[4.3rem]">
            {mvEnergyToday.score}
          </span>
          <span className="mt-1 text-caption text-mv-text-secondary tablet:text-body-sm">{mvEnergyToday.label}</span>
        </div>
      </div>
    </div>
  );
}
