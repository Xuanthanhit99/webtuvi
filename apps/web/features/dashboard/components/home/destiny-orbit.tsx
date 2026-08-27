'use client';

import { useId } from 'react';

/**
 * "Đông Phương Thiên Nghi" — the Home hero's signature celestial instrument.
 *
 * BOARD 01 ART REBUILD (2nd pass): the first SVG rebuild was rejected as too sparse — "thin
 * circles over the background." Rebuilt again with the full requested layer set: an atmospheric
 * contrast halo behind everything (so the gold reads against the hero nebula without a hard UI
 * container), a multi-stroke engraved bezel with a 3-tier tick system, a fixed sector ring that
 * pairs the 12 Earthly Branch glyphs with real sector geometry (dividers + alternating tint)
 * instead of floating text, a separately-rotating celestial symbol ring, a broken-arc inner ring
 * set with radial construction lines, tilted elliptical astrolabe orbits with intersection nodes,
 * a real constellation network (named stars + jade accents + independent twinkle), several
 * independently-orbiting markers, and a multi-ring center core. ~17 distinct animated/static
 * layers. Every rotating layer uses `motion-safe:` so `prefers-reduced-motion` freezes rotation
 * outright — the full composition still renders, nothing depends on movement to be legible. The
 * 12 glyphs live on their own non-rotating layer so they never spin with the rings around them.
 */
const EARTHLY_BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const CENTER = 260;

function polar(radius: number, deg: number, cx = CENTER, cy = CENTER) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
}

function fourPointStar(cx: number, cy: number, r: number, inner: number) {
  const outerPts = [0, 90, 180, 270].map((deg) => polar(r, deg, cx, cy));
  const innerPts = [45, 135, 225, 315].map((deg) => polar(inner, deg, cx, cy));
  return `M${outerPts[0]!.x},${outerPts[0]!.y} L${innerPts[0]!.x},${innerPts[0]!.y} L${outerPts[1]!.x},${outerPts[1]!.y} L${innerPts[1]!.x},${innerPts[1]!.y} L${outerPts[2]!.x},${outerPts[2]!.y} L${innerPts[2]!.x},${innerPts[2]!.y} L${outerPts[3]!.x},${outerPts[3]!.y} L${innerPts[3]!.x},${innerPts[3]!.y} Z`;
}

const TWELVE = Array.from({ length: 12 }, (_, i) => i * 30);
const MAJOR_TICKS = Array.from({ length: 12 }, (_, i) => i * 30);
const MID_TICKS = Array.from({ length: 24 }, (_, i) => i * 15).filter((d) => d % 30 !== 0);
const MINOR_TICKS = Array.from({ length: 120 }, (_, i) => i * 3).filter((d) => d % 15 !== 0);
const SYMBOL_RING = Array.from({ length: 24 }, (_, i) => i * 15).filter((d) => d % 30 !== 0);
const DUST = Array.from({ length: 26 }, (_, i) => ({ deg: i * (360 / 26) + (i % 2) * 4, r: 236 + ((i * 7) % 16) }));

const CONSTELLATION_NODES = [
  { x: -18, y: -132, r: 1.6 },
  { x: 10, y: -118, r: 3.2, named: true },
  { x: 34, y: -96, r: 1.4 },
  { x: -46, y: -84, r: 1.8, jade: true },
  { x: 4, y: -78, r: 1.4 },
  { x: 52, y: -58, r: 1.4 },
  { x: -66, y: -40, r: 1.6 },
  { x: -20, y: -34, r: 2.8, named: true },
  { x: 26, y: -18, r: 1.4, jade: true },
  { x: 66, y: -10, r: 1.4 },
  { x: -50, y: 12, r: 1.4 },
  { x: 8, y: 24, r: 1.6 },
  { x: 48, y: 34, r: 1.4, jade: true },
  { x: -30, y: 50, r: 2.6, named: true },
  { x: -70, y: 44, r: 1.4 },
  { x: 24, y: 62, r: 1.4 },
  { x: 62, y: 66, r: 1.4, jade: true },
  { x: -6, y: 84, r: 1.4 },
  { x: -46, y: 90, r: 1.4 },
] as const;
const CONSTELLATION_LINKS: Array<[number, number]> = [
  [0, 1],
  [1, 2],
  [3, 4],
  [4, 1],
  [5, 2],
  [6, 7],
  [7, 4],
  [8, 9],
  [7, 10],
  [11, 12],
  [12, 9],
  [13, 14],
  [13, 11],
  [15, 12],
  [16, 15],
  [17, 18],
  [17, 13],
];

export function DestinyOrbit({ className }: { className?: string }) {
  const rawId = useId();
  const uid = rawId.replace(/[^a-zA-Z0-9]/g, '');
  const g = (id: string) => `url(#${uid}-${id})`;

  return (
    <div className={className} style={{ position: 'relative', aspectRatio: '1 / 1' }} aria-hidden="true">
      <svg viewBox="0 0 520 520" className="h-full w-full">
        <defs>
          <radialGradient id={`${uid}-core`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff8e6" />
            <stop offset="35%" stopColor="#f3d998" />
            <stop offset="100%" stopColor="#c6923f" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`${uid}-gold`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f6e3ad" />
            <stop offset="50%" stopColor="#d5ad62" />
            <stop offset="100%" stopColor="#8e6a2f" />
          </linearGradient>
          <linearGradient id={`${uid}-goldDim`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c9a468" />
            <stop offset="100%" stopColor="#6b4f28" />
          </linearGradient>
          {/* WHEEL POLISH: a real 4-stop "cast metal" gradient — dark bronze edge, antique gold
              body, a warm highlight, and an ivory specular point — reserved for the primary
              structural ring only (§5: fine engraving stays flatter/dimmer, not every line gets
              this treatment). */}
          <linearGradient id={`${uid}-metal`} x1="15%" y1="0%" x2="85%" y2="100%">
            <stop offset="0%" stopColor="#5f4522" />
            <stop offset="30%" stopColor="#d5ad62" />
            <stop offset="62%" stopColor="#f6e3ad" />
            <stop offset="100%" stopColor="#fff8e6" />
          </linearGradient>
          <radialGradient id={`${uid}-jade`} cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#c3ddce" />
            <stop offset="100%" stopColor="#5b7a68" />
          </radialGradient>
          <radialGradient id={`${uid}-halo`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f3d998" stopOpacity="0.22" />
            <stop offset="55%" stopColor="#c9a568" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#c9a568" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${uid}-contrast`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#050a12" stopOpacity="0.72" />
            <stop offset="45%" stopColor="#050a12" stopOpacity="0.58" />
            <stop offset="75%" stopColor="#050a12" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#050a12" stopOpacity="0" />
          </radialGradient>
          {/* WHEEL POLISH: a warm inner glow layered on top of the contrast halo so the darkened
              backdrop doesn't read as flat/cold — the instrument still separates clearly from the
              hero nebula, but the center keeps a lived-in warmth instead of a grey void. */}
          <radialGradient id={`${uid}-warmglow`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#3a2410" stopOpacity="0.35" />
            <stop offset="55%" stopColor="#3a2410" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#3a2410" stopOpacity="0" />
          </radialGradient>
          <filter id={`${uid}-soft`} x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="3.4" />
          </filter>
          <filter id={`${uid}-softer`} x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur stdDeviation="1" />
          </filter>
          <filter id={`${uid}-star`} x="-300%" y="-300%" width="700%" height="700%">
            <feGaussianBlur stdDeviation="1.6" />
          </filter>
        </defs>

        {/* Layer 1 — atmospheric contrast halo. Sits behind every other layer so the hero's
            mountains/nebula still show through outside the ring band, but the gold geometry gets
            a soft darkened backdrop instead of disappearing into it. Not a hard-edged UI circle —
            a radial gradient with no sharp stop. */}
        <circle cx={CENTER} cy={CENTER} r={252} fill={g('contrast')} />
        <circle cx={CENTER} cy={CENTER} r={220} fill={g('warmglow')} />

        {/* Layer 2 — outer celestial halo: a slow warm glow breathing very gently. */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={248}
          fill={g('halo')}
          className="motion-safe:animate-[mv-breathe_14s_ease-in-out_infinite]"
        />

        {/* Layer 3 — star-dust particles scattered just outside the bezel. Very slow drift.
            V8.1 MOTION TUNING: 340s→170s. V9 MOTION TUNING (this pass): 170s→165s — the founder
            again reported the wheel as imperceptibly static after V8.1's measured 40px/5s
            displacement, so every layer was cut further, this time toward the founder's own
            explicit perceptual bands (primary ring 60-90s, inner astrolabe 55-90s, marker
            18-32s, outer geometry 120-200s) rather than a uniform halving. Relative speed
            ordering and alternating cw/ccw directions preserved again. */}
        <g style={{ transformOrigin: '260px 260px' }} className="motion-safe:animate-[mv-orbit-spin_165s_linear_infinite]">
          {DUST.map((d, i) => {
            const p = polar(d.r, d.deg);
            return <circle key={i} cx={p.x} cy={p.y} r={i % 5 === 0 ? 1.3 : 0.7} fill="#f1e3bb" opacity={i % 5 === 0 ? 0.5 : 0.28} />;
          })}
        </g>

        {/* Layer 4 — outer engraved bezel: bright ring + dimmer inner ring (alternating
            brightness) + a dashed engraved line + a 3-tier tick system (minor/mid/major) + one
            restrained seal-red mark. Clockwise, very slow — cast metal turning, not spinning.
            V8.1 MOTION TUNING: 260s→150s. */}
        <g style={{ transformOrigin: '260px 260px' }} className="motion-safe:animate-[mv-orbit-spin_125s_linear_infinite]">
          {/* primary structural ring — the brightest line on the whole instrument, real cast-metal
              gradient rather than a flat stroke */}
          <circle cx={CENTER} cy={CENTER} r={244} fill="none" stroke={g('metal')} strokeWidth="2" strokeOpacity="0.92" />
          {/* metallic highlight + opposite shadow arc segments on the primary ring — the "localized
              metallic highlight" and "restrained bronze shadow" the founder asked for, instead of
              one uniformly-bright stroke */}
          <path d={`M${polar(244, -55).x},${polar(244, -55).y} A244,244 0 0 1 ${polar(244, 15).x},${polar(244, 15).y}`} fill="none" stroke="#fff8e6" strokeWidth="2.4" strokeOpacity="0.55" strokeLinecap="round" />
          <path d={`M${polar(244, 125).x},${polar(244, 125).y} A244,244 0 0 1 ${polar(244, 195).x},${polar(244, 195).y}`} fill="none" stroke="#4a3216" strokeWidth="2" strokeOpacity="0.5" strokeLinecap="round" />
          {/* secondary structural ring — clearly one hierarchy tier down */}
          <circle cx={CENTER} cy={CENTER} r={236} fill="none" stroke={g('goldDim')} strokeWidth="0.9" strokeOpacity="0.42" />
          {/* tertiary engraved line — dark gold, flattest of the three */}
          <circle cx={CENTER} cy={CENTER} r={240} fill="none" stroke="#8e6a2f" strokeWidth="0.6" strokeOpacity="0.4" strokeDasharray="1.5 4.5" />
          {MINOR_TICKS.map((deg) => {
            const a = polar(229, deg);
            const b = polar(233, deg);
            return <line key={`mn${deg}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#8e6a2f" strokeWidth="0.4" strokeOpacity="0.2" />;
          })}
          {MID_TICKS.map((deg) => {
            const a = polar(223, deg);
            const b = polar(233, deg);
            return <line key={`md${deg}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#d5ad62" strokeWidth="0.7" strokeOpacity="0.5" />;
          })}
          {MAJOR_TICKS.map((deg) => {
            const a = polar(216, deg);
            const b = polar(234, deg);
            return <line key={`mj${deg}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#fff2cf" strokeWidth="1.5" strokeOpacity="0.85" />;
          })}
          <circle cx={polar(239, 202).x} cy={polar(239, 202).y} r={3.2} fill="#c1584c" opacity="0.75" />
        </g>

        {/* Layer 5 — celestial symbol ring: 16 small diamond ornaments offset from the Earthly
            Branch sectors, plus a fine ring line. Counter-clockwise, independent of the bezel.
            V8.1 MOTION TUNING: 205s→105s — this is the most visually prominent rotating ring
            (16 gold diamond ornaments), tuned toward the founder's "primary visible celestial
            ring" band (80-140s) so it's the layer most likely to read as moving within 5-10s. */}
        <g style={{ transformOrigin: '260px 260px' }} className="motion-safe:animate-[mv-orbit-spin-reverse_75s_linear_infinite]">
          <circle cx={CENTER} cy={CENTER} r={205} fill="none" stroke="#c9a568" strokeWidth="0.5" strokeOpacity="0.3" />
          {SYMBOL_RING.map((deg, i) => {
            const p = polar(205, deg);
            return <path key={deg} d={fourPointStar(p.x, p.y, i % 3 === 0 ? 3.2 : 2, 0.7)} fill="#f3d998" opacity={i % 3 === 0 ? 0.75 : 0.5} />;
          })}
        </g>

        {/* Layer 6 — inner ring set: a broken (dashed/segmented) arc, one fine solid ring, and 12
            radial construction lines reaching toward the sector band. Clockwise.
            V8.1 MOTION TUNING: 150s→95s. */}
        <g style={{ transformOrigin: '260px 260px' }} className="motion-safe:animate-[mv-orbit-spin_65s_linear_infinite]">
          <circle cx={CENTER} cy={CENTER} r={168} fill="none" stroke={g('gold')} strokeWidth="0.9" strokeOpacity="0.45" strokeDasharray="16 6" />
          <circle cx={CENTER} cy={CENTER} r={140} fill="none" stroke="#d5ad62" strokeWidth="0.6" strokeOpacity="0.3" />
          {TWELVE.map((deg) => {
            const a = polar(60, deg);
            const b = polar(168, deg);
            return <line key={deg} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#c9a568" strokeWidth="0.4" strokeOpacity="0.2" />;
          })}
        </g>

        {/* Layer 7 — eccentric elliptical astrolabe geometry: two tilted orbital paths with
            intersection nodes, the "armillary" reading beneath the constellation network.
            V8.1 MOTION TUNING: 120s→75s. */}
        <g style={{ transformOrigin: '260px 260px' }} className="motion-safe:animate-[mv-orbit-spin-reverse_60s_linear_infinite]">
          <ellipse cx={CENTER} cy={CENTER} rx={128} ry={62} fill="none" stroke={g('goldDim')} strokeWidth="0.7" strokeOpacity="0.4" transform={`rotate(-24 ${CENTER} ${CENTER})`} />
          <ellipse cx={CENTER} cy={CENTER} rx={104} ry={48} fill="none" stroke={g('goldDim')} strokeWidth="0.6" strokeOpacity="0.34" transform={`rotate(31 ${CENTER} ${CENTER})`} />
          <circle cx={CENTER + 118} cy={CENTER - 18} r={2.6} fill="#f3d998" opacity="0.85" />
          <circle cx={CENTER - 96} cy={CENTER + 14} r={2.2} fill={g('jade')} opacity="0.9" />
        </g>

        {/* Layer 8 — constellation network: ~19 stars (3 brighter "named" points, 4 jade) linked
            by thin lines into two loose clusters. Very slow drift. V8.1 MOTION TUNING: 320s→160s. */}
        <g style={{ transformOrigin: '260px 260px' }} className="motion-safe:animate-[mv-orbit-spin_150s_linear_infinite]">
          {CONSTELLATION_LINKS.map(([a, b], i) => {
            const from = CONSTELLATION_NODES[a]!;
            const to = CONSTELLATION_NODES[b]!;
            return (
              <line
                key={i}
                x1={CENTER + from.x}
                y1={CENTER + from.y}
                x2={CENTER + to.x}
                y2={CENTER + to.y}
                stroke="#e6c980"
                strokeWidth="0.5"
                strokeOpacity="0.32"
              />
            );
          })}
          {CONSTELLATION_NODES.map((n, i) => (
            <circle
              key={i}
              cx={CENTER + n.x}
              cy={CENTER + n.y}
              r={'jade' in n && n.jade ? n.r + 0.6 : n.r}
              fill={'jade' in n && n.jade ? g('jade') : '#f3d998'}
              opacity={'named' in n && n.named ? 1 : 'jade' in n && n.jade ? 0.85 : 0.72}
              filter={'named' in n && n.named ? `url(#${uid}-star)` : undefined}
              className={
                i === 1
                  ? 'motion-safe:animate-[mv-breathe_5s_ease-in-out_infinite]'
                  : i === 7
                    ? 'motion-safe:animate-[mv-breathe_6.5s_ease-in-out_infinite]'
                    : i === 13
                      ? 'motion-safe:animate-[mv-breathe_8s_ease-in-out_infinite]'
                      : undefined
              }
            />
          ))}
        </g>

        {/* Layer 9 — independently-orbiting small celestial markers, each its own speed/direction
            so they read as separate wandering points rather than one mechanism.
            V8.1 MOTION TUNING: these are the fastest layers on the instrument and the ones most
            likely to show plainly visible displacement within a 5-10s glance — retuned into the
            founder's "small traveling marker" band (35-60s), each still a distinct speed. */}
        <g style={{ transformOrigin: '260px 260px' }} className="motion-safe:animate-[mv-orbit-spin_32s_linear_infinite]">
          <path d={fourPointStar(polar(177, 20).x, polar(177, 20).y, 4.4, 1.5)} fill="#f3d998" opacity="0.85" />
        </g>
        <g style={{ transformOrigin: '260px 260px' }} className="motion-safe:animate-[mv-orbit-spin-reverse_28s_linear_infinite]">
          <path d={fourPointStar(polar(177, 140).x, polar(177, 140).y, 3.8, 1.3)} fill="#f3d998" opacity="0.8" />
        </g>
        <g style={{ transformOrigin: '260px 260px' }} className="motion-safe:animate-[mv-orbit-spin-reverse_24s_linear_infinite]">
          <path d={fourPointStar(polar(104, 65).x, polar(104, 65).y, 3.4, 1.2)} fill="#e6c980" opacity="0.75" />
        </g>
        <g style={{ transformOrigin: '260px 260px' }} className="motion-safe:animate-[mv-orbit-spin_30s_linear_infinite]">
          <path d={fourPointStar(polar(104, 255).x, polar(104, 255).y, 3.4, 1.2)} fill="#e6c980" opacity="0.75" />
        </g>
        <g style={{ transformOrigin: '260px 260px' }} className="motion-safe:animate-[mv-orbit-spin_22s_linear_infinite]">
          <circle cx={polar(74, 300).x} cy={polar(74, 300).y} r={2.6} fill={g('jade')} opacity="0.7" />
        </g>
        <g style={{ transformOrigin: '260px 260px' }} className="motion-safe:animate-[mv-orbit-spin-reverse_26s_linear_infinite]">
          <circle cx={polar(190, 170).x} cy={polar(190, 170).y} r={1.6} fill="#f3d998" opacity="0.6" />
        </g>

        {/* Layer 10 — fixed sector ring: alternating faint sector tint, 12 radial dividers, and
            the 12 Earthly Branch glyphs sitting inside their own sector rather than floating text.
            Deliberately non-rotating so the glyphs stay upright and readable regardless of what
            turns behind them, per the founder's explicit requirement. */}
        <g>
          {TWELVE.map((deg, i) => {
            if (i % 2 !== 0) return null;
            const a1 = polar(190, deg - 15);
            const a2 = polar(224, deg - 15);
            const a3 = polar(224, deg + 15);
            const a4 = polar(190, deg + 15);
            return (
              <path
                key={deg}
                d={`M${a1.x},${a1.y} A190,190 0 0 1 ${a4.x},${a4.y} L${a3.x},${a3.y} A224,224 0 0 0 ${a2.x},${a2.y} Z`}
                fill="#e6c980"
                opacity="0.06"
              />
            );
          })}
          {TWELVE.map((deg) => {
            const a = polar(188, deg - 15);
            const b = polar(224, deg - 15);
            return <line key={deg} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#d5ad62" strokeWidth="0.7" strokeOpacity="0.48" />;
          })}
          {EARTHLY_BRANCHES.map((glyph, i) => {
            const p = polar(207, i * 30);
            return (
              <text
                key={glyph}
                x={p.x}
                y={p.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="23"
                fontWeight={600}
                fill="#f6e3ad"
                stroke="#070b12"
                strokeWidth="2.4"
                strokeOpacity="0.4"
                paintOrder="stroke"
                fontFamily="'Songti SC', 'Noto Serif SC', 'PingFang SC', serif"
                opacity="0.98"
              >
                {glyph}
              </text>
            );
          })}
        </g>

        {/* Layer 11 — center destiny core: fixed, never rotates. Two soft halo rings, a blurred
            bloom (breathing), and a fixed 4-point star — compact and luminous, not an oversized
            white flare. */}
        <g>
          <circle cx={CENTER} cy={CENTER} r={58} fill="none" stroke="#c9a568" strokeWidth="0.4" strokeOpacity="0.18" strokeDasharray="2 5" />
          <circle cx={CENTER} cy={CENTER} r={48} fill="none" stroke="#f3d998" strokeWidth="0.5" strokeOpacity="0.28" />
          <circle cx={CENTER} cy={CENTER} r={36} fill="none" stroke="#f3d998" strokeWidth="0.7" strokeOpacity="0.42" />
          <circle
            cx={CENTER}
            cy={CENTER}
            r={30}
            fill={g('core')}
            filter={`url(#${uid}-soft)`}
            className="motion-safe:animate-[mv-breathe_7s_ease-in-out_infinite]"
          />
          <path d={fourPointStar(CENTER, CENTER, 24, 6.5)} fill="#fff8e6" opacity="0.95" />
          <path d={fourPointStar(CENTER, CENTER, 11, 3)} fill="#fff8e6" />
        </g>
      </svg>
    </div>
  );
}
