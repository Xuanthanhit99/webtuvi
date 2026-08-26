'use client';

import { useId } from 'react';

/**
 * BOARD 01 ART REBUILD (2nd pass): the first SVG rebuild was rejected as "a pagoda icon", "three
 * rectangles", "simple ellipses", "floating numbers" — minimal line-art mistaken for illustration.
 * Rebuilt again as small layered scenes: each has a background (celestial/atmospheric layer), a
 * midground (architecture/instrument/artifact with real material shading via gradients), and a
 * foreground (mist, glow, accent nodes), sharing the same gradient language as the reworked
 * Destiny Wheel (`destiny-orbit.tsx`) so the wheel and the four cards read as one instrument-
 * making tradition rather than four unrelated styles.
 *
 * Each illustration renders its own `<defs>` with a `useId()`-namespaced gradient set so two
 * simultaneous instances (Discovery card + guest-try card, for a guest) never collide on a
 * shared gradient id — documented as a real bug in an earlier hand-SVG pass
 * (docs/design/board-01-v3-asset-manifest.md Revision 7), avoided here from the start.
 */

function IllustrationDefs({ uid }: { uid: string }) {
  return (
    <defs>
      <linearGradient id={`${uid}-bronze`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f6e3ad" />
        <stop offset="55%" stopColor="#d5ad62" />
        <stop offset="100%" stopColor="#8e6a2f" />
      </linearGradient>
      <linearGradient id={`${uid}-bronzeDim`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#c9a468" />
        <stop offset="100%" stopColor="#5f4522" />
      </linearGradient>
      <linearGradient id={`${uid}-paper`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f0dfb8" />
        <stop offset="55%" stopColor="#d9bd85" />
        <stop offset="100%" stopColor="#93713f" />
      </linearGradient>
      <radialGradient id={`${uid}-jade`} cx="35%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#c3ddce" stopOpacity="0.95" />
        <stop offset="100%" stopColor="#5b7a68" stopOpacity="0.85" />
      </radialGradient>
      <linearGradient id={`${uid}-ink`} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#1c2c46" />
        <stop offset="100%" stopColor="#070b12" />
      </linearGradient>
      <linearGradient id={`${uid}-sky`} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#0a1220" />
        <stop offset="55%" stopColor="#16233a" />
        <stop offset="100%" stopColor="#2c2314" />
      </linearGradient>
      <radialGradient id={`${uid}-glow`} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#fff2cf" stopOpacity="0.95" />
        <stop offset="45%" stopColor="#e6c980" stopOpacity="0.3" />
        <stop offset="100%" stopColor="#d5ad62" stopOpacity="0" />
      </radialGradient>
      <radialGradient id={`${uid}-seal`} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#c1584c" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#7a2e26" stopOpacity="0.6" />
      </radialGradient>
      <radialGradient id={`${uid}-shadow`} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#000000" stopOpacity="0.42" />
        <stop offset="100%" stopColor="#000000" stopOpacity="0" />
      </radialGradient>
      <filter id={`${uid}-soft`} x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation="2.6" />
      </filter>
      <filter id={`${uid}-mist`} x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="5.5" />
      </filter>
      <filter id={`${uid}-star`} x="-300%" y="-300%" width="700%" height="700%">
        <feGaussianBlur stdDeviation="1.4" />
      </filter>
    </defs>
  );
}

function MistBand({ uid, d, opacity }: { uid: string; d: string; opacity: number }) {
  return <path d={d} fill="#e8dcc4" opacity={opacity} filter={`url(#${uid}-mist)`} />;
}

/* ---------------------------------------------------------------------- Tử Vi */

function TuViIllustration({ uid }: { uid: string }) {
  const g = (id: string) => `url(#${uid}-${id})`;
  return (
    <svg viewBox="0 0 240 240" preserveAspectRatio="xMidYMax meet" className="h-full w-full">
      <IllustrationDefs uid={uid} />
      {/* background: dim celestial disc behind the architecture */}
      <g opacity="0.45" transform="translate(150,72)">
        <circle r="58" fill="none" stroke={g('bronze')} strokeWidth="0.6" strokeOpacity="0.4" />
        <circle r="40" fill="none" stroke={g('bronze')} strokeWidth="0.5" strokeOpacity="0.3" />
        {Array.from({ length: 12 }, (_, i) => i * 30).map((deg) => {
          const rad = (deg * Math.PI) / 180;
          return <line key={deg} x1="0" y1="0" x2={58 * Math.cos(rad)} y2={58 * Math.sin(rad)} stroke={g('bronze')} strokeWidth="0.35" strokeOpacity="0.22" />;
        })}
        <circle r="4" fill={g('glow')} filter={`url(#${uid}-soft)`} />
      </g>
      {/* warm sky glow (light source, upper-right behind pavilion) */}
      <circle cx="150" cy="120" r="70" fill={g('glow')} opacity="0.6" filter={`url(#${uid}-soft)`} />
      {/* background mountain layer — far, cool, low-contrast */}
      <path
        d="M-10,196 L26,132 L54,162 L92,96 L128,150 L160,110 L200,196 Z"
        fill={g('sky')}
        opacity="0.55"
        stroke={g('bronzeDim')}
        strokeWidth="0.6"
        strokeOpacity="0.3"
      />
      {/* midground mountain layer — nearer, warmer rim-light */}
      <path
        d="M-10,214 L18,168 L40,190 L64,144 L88,176 L108,150 L132,196 L156,158 L200,214 Z"
        fill={g('ink')}
        stroke={g('bronze')}
        strokeWidth="0.9"
        strokeOpacity="0.55"
      />
      <MistBand uid={uid} d="M-6,182 Q60,164 120,182 Q170,168 206,182 L206,206 L-6,206 Z" opacity={0.4} />
      <ellipse cx="76" cy="222" rx="52" ry="8" fill={g('shadow')} />
      {/* pavilion — solid ink body with a fine gold outline on every roof tier */}
      <g transform="translate(52,96)">
        <path d="M0,116 L0,72 L46,72 L46,116 Z" fill={g('ink')} stroke={g('bronze')} strokeWidth="1.1" strokeOpacity="0.78" />
        <path d="M5,72 L41,72 L46,72 L23,53 Z" fill={g('bronze')} stroke="#070b12" strokeOpacity="0.35" strokeWidth="0.5" />
        <path d="M-8,53 L54,53 L47,38 L0,38 Z" fill={g('bronze')} stroke="#070b12" strokeOpacity="0.35" strokeWidth="0.5" />
        <path d="M-3,38 L49,38 L44,24 L2,24 Z" fill={g('bronze')} stroke="#070b12" strokeOpacity="0.35" strokeWidth="0.5" />
        <path d="M7,24 L39,24 L34,10 L12,10 Z" fill={g('bronze')} stroke="#070b12" strokeOpacity="0.35" strokeWidth="0.5" />
        <line x1="23" y1="10" x2="23" y2="-12" stroke={g('bronze')} strokeWidth="1.3" />
        <circle cx="23" cy="-14" r="3" fill="#e6c980" filter={`url(#${uid}-soft)`} />
        {/* jade finial bead */}
        <circle cx="23" cy="10" r="2" fill={g('jade')} />
        <line x1="10" y1="72" x2="10" y2="116" stroke="#070b12" strokeOpacity="0.6" strokeWidth="0.8" />
        <line x1="36" y1="72" x2="36" y2="116" stroke="#070b12" strokeOpacity="0.6" strokeWidth="0.8" />
        <rect x="15" y="90" width="16" height="26" fill="#070b12" opacity="0.72" stroke={g('bronze')} strokeWidth="0.6" strokeOpacity="0.5" />
        {/* glowing window points */}
        <circle cx="6" cy="82" r="1.6" fill="#ffe9b0" filter={`url(#${uid}-soft)`} />
        <circle cx="40" cy="82" r="1.6" fill="#ffe9b0" filter={`url(#${uid}-soft)`} />
        {/* seal-red door accent */}
        <rect x="20" y="106" width="6" height="10" fill={g('seal')} opacity="0.85" />
      </g>
      <MistBand uid={uid} d="M-10,208 Q70,192 150,208 Q180,196 210,208 L210,224 L-10,224 Z" opacity={0.5} />
      <path d="M120,44 Q140,30 160,44 Q176,34 194,44" fill="none" stroke={g('bronze')} strokeWidth="0.8" strokeOpacity="0.3" strokeLinecap="round" />
    </svg>
  );
}

/* ---------------------------------------------------------------------- Tarot */

function TarotIllustration({ uid }: { uid: string }) {
  const g = (id: string) => `url(#${uid}-${id})`;
  const cardShadow = (x: number, rotate: number) => (
    <ellipse cx={x} cy={186} rx="34" ry="8" fill={g('shadow')} transform={`rotate(${rotate} ${x} 150)`} />
  );
  const card = (rotate: number, x: number, glyph: 'star' | 'moon-left' | 'moon-right') => (
    <g transform={`translate(${x},150) rotate(${rotate})`}>
      <rect x="-32" y="-56" width="64" height="104" rx="7" fill={g('ink')} stroke={g('bronze')} strokeWidth="1.3" />
      <rect x="-26" y="-50" width="52" height="92" rx="4" fill="none" stroke={g('bronze')} strokeWidth="0.5" strokeOpacity="0.55" />
      {/* corner flourishes instead of a plain border */}
      {[
        [-26, -50],
        [26, -50],
        [-26, 42],
        [26, 42],
      ].map(([cx, cy], i) => (
        <path key={i} d={`M${cx},${cy! + (cy! < 0 ? 6 : -6)} L${cx},${cy} L${cx! + (cx! < 0 ? 6 : -6)},${cy}`} fill="none" stroke={g('bronze')} strokeWidth="0.9" strokeOpacity="0.7" />
      ))}
      {glyph === 'star' && (
        <g>
          <circle r="20" fill="none" stroke="#f3d998" strokeOpacity="0.35" strokeWidth="0.6" />
          <path d="M0,-11 L2.6,-2.6 L11,0 L2.6,2.6 L0,11 L-2.6,2.6 L-11,0 L-2.6,-2.6 Z" fill="#f3d998" opacity="0.95" filter={`url(#${uid}-star)`} />
          <path d="M0,-11 L2.6,-2.6 L11,0 L2.6,2.6 L0,11 L-2.6,2.6 L-11,0 L-2.6,-2.6 Z" fill="#fff8e6" />
        </g>
      )}
      {glyph === 'moon-left' && (
        <g>
          <path d="M0,-15 A15,15 0 1 0 0,15 A11,15 0 1 1 0,-15 Z" fill={g('bronze')} opacity="0.9" />
          <circle cx="-6" cy="-4" r="1.2" fill="#fff8e6" opacity="0.6" />
        </g>
      )}
      {glyph === 'moon-right' && (
        <g>
          <path d="M0,-15 A15,15 0 1 1 0,15 A11,15 0 1 0 0,-15 Z" fill={g('bronze')} opacity="0.9" />
          <circle cx="6" cy="6" r="1.2" fill="#fff8e6" opacity="0.6" />
        </g>
      )}
    </g>
  );
  return (
    <svg viewBox="0 0 240 240" preserveAspectRatio="xMidYMax meet" className="h-full w-full">
      <IllustrationDefs uid={uid} />
      <circle cx="120" cy="140" r="80" fill={g('glow')} opacity="0.5" filter={`url(#${uid}-soft)`} />
      {/* table/silk surface */}
      <path d="M-10,214 Q120,192 250,214 L250,240 L-10,240 Z" fill={g('ink')} opacity="0.75" />
      <path d="M-10,214 Q120,192 250,214" fill="none" stroke={g('bronze')} strokeWidth="0.7" strokeOpacity="0.4" />
      {/* incense smoke wisp */}
      <path d="M46,210 Q60,180 44,158 Q64,150 58,120" fill="none" stroke="#e8dcc4" strokeWidth="1" strokeOpacity="0.28" strokeLinecap="round" filter={`url(#${uid}-mist)`} />
      {cardShadow(88, -14)}
      {cardShadow(152, 14)}
      {cardShadow(120, 0)}
      {card(-14, 88, 'moon-left')}
      {card(14, 152, 'moon-right')}
      {card(0, 120, 'star')}
      {/* hanging tassel off the center card */}
      <path d="M120,94 Q124,110 120,124" fill="none" stroke={g('bronze')} strokeWidth="0.8" strokeOpacity="0.6" />
      <circle cx="120" cy="127" r="2.4" fill={g('seal')} />
    </svg>
  );
}

/* ---------------------------------------------------------------------- Bản đồ sao */

function NatalIllustration({ uid }: { uid: string }) {
  const g = (id: string) => `url(#${uid}-${id})`;
  const stars = [
    [46, 40, 1.6, false, true],
    [196, 46, 1.3, true, false],
    [26, 150, 1.4, true, false],
    [206, 156, 1.2, false, false],
    [116, 24, 1, false, false],
    [64, 196, 1.3, false, false],
    [172, 190, 1.4, true, false],
  ] as const;
  return (
    <svg viewBox="0 0 240 240" preserveAspectRatio="xMidYMax meet" className="h-full w-full">
      <IllustrationDefs uid={uid} />
      <circle cx="120" cy="120" r="90" fill={g('glow')} opacity="0.5" filter={`url(#${uid}-soft)`} />
      {/* observatory/mountain silhouette base */}
      <path d="M-10,232 L34,178 L58,206 L90,158 L120,232 Z" fill={g('ink')} opacity="0.85" stroke={g('bronze')} strokeWidth="0.8" strokeOpacity="0.4" />
      <ellipse cx="60" cy="236" rx="60" ry="8" fill={g('shadow')} />
      <g transform="translate(120,120)">
        {/* armillary rings — 4, varying tilt/size, engraved ticks on the largest */}
        <ellipse rx="98" ry="42" fill="none" stroke={g('bronze')} strokeWidth="0.8" strokeOpacity="0.5" transform="rotate(-22)" />
        {Array.from({ length: 24 }, (_, i) => i * 15).map((deg) => {
          const rad = (deg * Math.PI) / 180;
          const x1 = 98 * Math.cos(rad);
          const y1 = 42 * Math.sin(rad);
          const x2 = 103 * Math.cos(rad);
          const y2 = 44 * Math.sin(rad);
          return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} stroke={g('bronze')} strokeWidth="0.4" strokeOpacity="0.35" transform="rotate(-22)" />;
        })}
        <ellipse rx="78" ry="34" fill="none" stroke={g('bronzeDim')} strokeWidth="0.6" strokeOpacity="0.4" transform="rotate(18)" />
        <ellipse rx="56" ry="56" fill="none" stroke={g('bronze')} strokeWidth="0.5" strokeOpacity="0.32" />
        <ellipse rx="40" ry="18" fill="none" stroke={g('bronzeDim')} strokeWidth="0.5" strokeOpacity="0.3" transform="rotate(-52)" />
        {/* celestial sphere at center */}
        <circle r="12" fill={g('glow')} filter={`url(#${uid}-soft)`} />
        <circle r="5.5" fill="#f3d998" />
        <circle r="5.5" fill="none" stroke="#fff8e6" strokeWidth="0.5" strokeOpacity="0.5" />
        {/* orbital bodies */}
        <circle cx="98" cy="-8" r="3.2" fill={g('jade')} transform="rotate(-22)" />
        <circle cx="-78" cy="10" r="2.6" fill="#e6c980" transform="rotate(18)" />
        <circle cx="0" cy="-56" r="2.2" fill={g('jade')} />
        <circle cx="40" cy="4" r="2" fill="#e6c980" transform="rotate(-52)" />
      </g>
      {stars.map(([x, y, r, jade], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill={jade ? g('jade') : '#e6c980'} opacity="0.75" />
      ))}
      <path d="M46,40 L116,24 L196,46" fill="none" stroke={g('bronze')} strokeWidth="0.4" strokeOpacity="0.2" />
      <path d="M26,150 L64,196 L172,190" fill="none" stroke={g('bronze')} strokeWidth="0.4" strokeOpacity="0.16" />
    </svg>
  );
}

/* ---------------------------------------------------------------------- Thần số học */

function NumerologyIllustration({ uid }: { uid: string }) {
  const g = (id: string) => `url(#${uid}-${id})`;
  const grid = [
    ['3', 78, 76],
    ['5', 122, 76],
    ['1', 166, 76],
    ['7', 78, 120],
    ['8', 122, 120],
    ['2', 166, 120],
    ['9', 78, 164],
    ['6', 122, 164],
    ['4', 166, 164],
  ] as const;
  return (
    <svg viewBox="0 0 240 240" preserveAspectRatio="xMidYMax meet" className="h-full w-full">
      <IllustrationDefs uid={uid} />
      <circle cx="122" cy="120" r="90" fill={g('glow')} opacity="0.4" filter={`url(#${uid}-soft)`} />
      <ellipse cx="122" cy="222" rx="76" ry="10" fill={g('shadow')} />
      {/* parchment tablet with a tilt for depth */}
      <g transform="rotate(-2 122 130)">
        <rect x="40" y="42" width="164" height="176" rx="10" fill={g('paper')} stroke={g('bronze')} strokeWidth="1.1" strokeOpacity="0.65" />
        <rect x="48" y="50" width="148" height="160" rx="7" fill="none" stroke="#5f4522" strokeWidth="0.5" strokeOpacity="0.3" />
        {/* age/wear arcs */}
        <path d="M52,60 Q122,50 192,60" fill="none" stroke="#5f4522" strokeWidth="0.4" strokeOpacity="0.2" />
        <path d="M52,204 Q122,212 192,204" fill="none" stroke="#5f4522" strokeWidth="0.4" strokeOpacity="0.2" />
        {/* compass construction geometry */}
        <circle cx="122" cy="130" r="66" fill="none" stroke="#6b4f28" strokeWidth="0.5" strokeOpacity="0.35" />
        <line x1="56" y1="130" x2="188" y2="130" stroke="#6b4f28" strokeWidth="0.4" strokeOpacity="0.22" />
        <line x1="122" y1="64" x2="122" y2="196" stroke="#6b4f28" strokeWidth="0.4" strokeOpacity="0.22" />
        <line x1="76" y1="84" x2="168" y2="176" stroke="#6b4f28" strokeWidth="0.3" strokeOpacity="0.16" />
        <line x1="168" y1="84" x2="76" y2="176" stroke="#6b4f28" strokeWidth="0.3" strokeOpacity="0.16" />
        {/* seal-red center accent behind 8 */}
        <circle cx="122" cy="120" r="26" fill={g('seal')} opacity="0.3" filter={`url(#${uid}-soft)`} />
        <circle cx="122" cy="120" r="19" fill="none" stroke={g('seal')} strokeWidth="0.8" strokeOpacity="0.55" />
        {grid.map(([n, x, y]) => (
          <text
            key={n}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="central"
            fontFamily="'Fraunces', Georgia, serif"
            fontSize={n === '8' ? 32 : 23}
            fontWeight={n === '8' ? 700 : 500}
            fill={n === '8' ? '#3a2a12' : '#4a3820'}
            opacity={n === '8' ? 0.92 : 0.72}
          >
            {n}
          </text>
        ))}
      </g>
      {[
        [50, 46],
        [196, 50],
        [46, 210],
        [198, 208],
      ].map(([x, y], i) => (
        <path
          key={i}
          d={`M${x},${y! - 5} L${x! + 1.4},${y! - 1.4} L${x! + 5},${y} L${x! + 1.4},${y! + 1.4} L${x},${y! + 5} L${x! - 1.4},${y! + 1.4} L${x! - 5},${y} L${x! - 1.4},${y! - 1.4} Z`}
          fill="#f3d998"
          opacity="0.6"
        />
      ))}
    </svg>
  );
}

const ILLUSTRATIONS = {
  tu_vi: TuViIllustration,
  tarot: TarotIllustration,
  natal_chart: NatalIllustration,
  numerology: NumerologyIllustration,
};

export function FeatureIllustration({ asset }: { asset: keyof typeof ILLUSTRATIONS }) {
  const rawId = useId();
  const uid = rawId.replace(/[^a-zA-Z0-9]/g, '');
  const Illustration = ILLUSTRATIONS[asset];
  return <Illustration uid={uid} />;
}
