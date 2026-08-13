import { ChevronDown } from 'lucide-react';
import { MvGreeting } from './mv-greeting';
import { MvDestinyOrbit } from './mv-destiny-orbit';

// Sparse constellation traces for the hero backdrop — a handful of dots and thin connecting
// lines, not a dense starfield. Positioned mostly right-of-center so they read as emanating
// from the Orbit rather than competing with the greeting text on the left.
const HERO_CONSTELLATION = [
  [72, 14],
  [83, 10],
  [92, 22],
  [64, 30],
  [88, 40],
] as const;

// Extra sparse background stars across the whole hero, echoing the reference's starlit scene.
const HERO_STARS = [
  [10, 15],
  [22, 55],
  [38, 12],
  [50, 68],
  [18, 80],
  [95, 60],
  [58, 8],
  [30, 35],
  [6, 45],
  [45, 85],
  [78, 75],
  [15, 25],
] as const;

export function MvHero() {
  return (
    <section className="relative min-h-[380px] overflow-hidden rounded-xl border border-mv-border bg-[#0c0f1f] p-4 tablet:p-10 desktop:min-h-[420px]">
      {/* One unified light source: a radial glow anchored near the Orbit's position, fading
          across the whole hero, so the Orbit reads as the origin of the hero's atmosphere
          rather than a widget dropped on top of an unrelated background. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(65% 75% at 78% 40%, rgba(119,101,255,0.20) 0%, rgba(119,101,255,0.08) 35%, transparent 70%), ' +
            'radial-gradient(40% 40% at 8% 100%, rgba(217,188,120,0.08) 0%, transparent 70%)',
        }}
      />

      {/* Distant planet + horizon silhouette, lower-left — echoes the reference's celestial
          landscape motif. Pure SVG/gradient, no raster asset. Sized up from the first pass —
          it was reading as too small/dark to register as a real depth layer. */}
      <svg
        className="pointer-events-none absolute -bottom-8 -left-8 hidden h-48 w-48 opacity-90 tablet:block"
        viewBox="0 0 200 200"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="mv-hero-planet" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#9A83FF" stopOpacity="0.7" />
            <stop offset="60%" stopColor="#7765FF" stopOpacity="0.38" />
            <stop offset="100%" stopColor="#7765FF" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="70" cy="70" r="58" fill="url(#mv-hero-planet)" />
        <circle cx="70" cy="70" r="58" fill="none" stroke="#D9BC78" strokeOpacity="0.28" strokeWidth="1" />
      </svg>
      <svg
        className="pointer-events-none absolute bottom-0 left-0 h-20 w-full opacity-60"
        preserveAspectRatio="none"
        viewBox="0 0 400 60"
        aria-hidden="true"
      >
        <path d="M0 60L0 38 60 20 130 42 200 16 280 40 340 24 400 38 400 60Z" fill="#080B14" fillOpacity="0.75" />
        <path
          d="M0 38L60 20 130 42 200 16 280 40 340 24 400 38"
          fill="none"
          stroke="#D9BC78"
          strokeOpacity="0.2"
          strokeWidth="1"
        />
      </svg>

      <svg
        className="pointer-events-none absolute inset-0 hidden h-full w-full opacity-75 tablet:block"
        aria-hidden="true"
      >
        <g stroke="#D9BC78" strokeOpacity="0.2" strokeWidth="1">
          <line x1="72%" y1="14%" x2="83%" y2="10%" />
          <line x1="83%" y1="10%" x2="92%" y2="22%" />
          <line x1="72%" y1="14%" x2="64%" y2="30%" />
          <line x1="92%" y1="22%" x2="88%" y2="40%" />
        </g>
        {HERO_CONSTELLATION.map(([x, y], i) => (
          <circle key={i} cx={`${x}%`} cy={`${y}%`} r={i === 2 ? 1.6 : 1.1} fill="#D9BC78" fillOpacity="0.6" />
        ))}
        {HERO_STARS.map(([x, y], i) => (
          <circle
            key={i}
            cx={`${x}%`}
            cy={`${y}%`}
            r={i % 3 === 0 ? 1.3 : 0.9}
            fill="#F4F1EA"
            fillOpacity={i % 3 === 0 ? 0.5 : 0.35}
          />
        ))}
      </svg>

      <div className="relative grid h-full items-center gap-4 tablet:grid-cols-[1fr_1.1fr] tablet:gap-10">
        <div>
          <MvGreeting />
          <button
            type="button"
            className="mt-3 inline-flex items-center gap-2 rounded-full bg-mv-gold px-5 py-2.5 text-body-sm font-semibold text-mv-bg transition-transform duration-fast hover:scale-[1.02] tablet:mt-6"
          >
            Xem lời chúc hôm nay
            <ChevronDown className="h-4 w-4 -rotate-90" aria-hidden="true" />
          </button>
        </div>
        <MvDestinyOrbit />
      </div>
    </section>
  );
}
