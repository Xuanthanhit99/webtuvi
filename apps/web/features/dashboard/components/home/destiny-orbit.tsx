/**
 * Decorative celestial centerpiece for Home. Every ring, glyph, and star position here is
 * hand-authored art direction, not a rendering of the user's real Tử Vi chart — the 12 Earthly
 * Branch labels are the same fixed compass every viewer sees. Never wire real chart data into this
 * component's angles/positions, or a decorative motif would start implying deterministic precision
 * it doesn't have (see docs brief: "never imply decorative moving coordinates are deterministic Tử
 * Vi facts"). Global `prefers-reduced-motion: reduce` handling in styles/globals.css already forces
 * every animation-duration to ~0 here, so reduced-motion users get the same artwork fully static.
 */
const BRANCHES = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];
const BRANCH_GLYPHS = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const CENTER = 200;

function pointOnCircle(index: number, count: number, radius: number, offsetDeg = -90) {
  const angle = ((index / count) * 360 + offsetDeg) * (Math.PI / 180);
  return { x: CENTER + Math.cos(angle) * radius, y: CENTER + Math.sin(angle) * radius };
}

export function DestinyOrbit({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 400" aria-hidden="true" className={className}>
      <defs>
        <radialGradient id="orbitGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#e6c980" stopOpacity="0.22" />
          <stop offset="60%" stopColor="#d5ad62" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#d5ad62" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="orbitCenterGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f2eee5" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#e6c980" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx={CENTER} cy={CENTER} r="196" fill="url(#orbitGlow)" />

      {/* Secondary symbol ring — counter-clockwise, slowest layer. */}
      <g
        className="origin-center animate-[mv-orbit-spin-reverse_150s_linear_infinite]"
        style={{ transformOrigin: `${CENTER}px ${CENTER}px` }}
      >
        {Array.from({ length: 8 }).map((_, index) => {
          const { x, y } = pointOnCircle(index, 8, 178);
          return <path key={index} d={`M${x} ${y - 4}l3 8 8 3-8 3-3 8-3-8-8-3 8-3z`} fill="#d5ad62" opacity="0.4" />;
        })}
        <circle cx={CENTER} cy={CENTER} r="178" fill="none" stroke="#d5ad62" strokeOpacity="0.14" strokeDasharray="1 7" strokeWidth="1.5" />
      </g>

      {/* Outer celestial ring — clockwise. */}
      <g className="origin-center animate-[mv-orbit-spin_120s_linear_infinite]" style={{ transformOrigin: `${CENTER}px ${CENTER}px` }}>
        <circle cx={CENTER} cy={CENTER} r="152" fill="none" stroke="#d5ad62" strokeOpacity="0.32" strokeWidth="1" />
        <circle cx={CENTER} cy={CENTER} r="146" fill="none" stroke="#d5ad62" strokeOpacity="0.16" strokeWidth="1" strokeDasharray="0.5 5" />
        {Array.from({ length: 24 }).map((_, index) => {
          const inner = pointOnCircle(index, 24, 146);
          const outer = pointOnCircle(index, 24, index % 3 === 0 ? 158 : 152);
          return <line key={index} x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke="#d5ad62" strokeOpacity="0.28" strokeWidth="1" />;
        })}
      </g>

      {/* Inner orbit — clockwise, a different speed than the outer ring, with a single traveling marker. */}
      <g className="origin-center animate-[mv-orbit-spin_70s_linear_infinite]" style={{ transformOrigin: `${CENTER}px ${CENTER}px` }}>
        <circle cx={CENTER} cy={CENTER} r="96" fill="none" stroke="#708c79" strokeOpacity="0.3" strokeWidth="1" />
        <circle cx={CENTER} cy={70} r="3" fill="#e6c980" opacity="0.9" />
        <path d={`M${CENTER} 70l0 -14`} stroke="#e6c980" strokeOpacity="0.4" strokeWidth="1" />
      </g>

      {/* Static readable compass — fixed, never rotates, so labels stay legible. */}
      <g>
        <ellipse cx={CENTER} cy={CENTER} rx="128" ry="40" fill="none" stroke="#708c79" strokeOpacity="0.22" strokeWidth="1" transform={`rotate(-18 ${CENTER} ${CENTER})`} />
        {BRANCHES.map((branch, index) => {
          const label = pointOnCircle(index, 12, 172);
          const glyph = pointOnCircle(index, 12, 126);
          return (
            <g key={branch}>
              <text x={label.x} y={label.y} textAnchor="middle" dominantBaseline="middle" fill="#f2eee5" fontSize="12" fontWeight="600">
                {branch}
              </text>
              <text x={glyph.x} y={glyph.y} textAnchor="middle" dominantBaseline="middle" fill="#8e7243" fontSize="10">
                {BRANCH_GLYPHS[index]}
              </text>
            </g>
          );
        })}
      </g>

      {/* Sparse twinkle, staggered so it never reads as a synchronized loading indicator. */}
      {[
        { x: 96, y: 118, r: 2, delay: '0s' },
        { x: 300, y: 96, r: 1.6, delay: '0.6s' },
        { x: 322, y: 260, r: 1.8, delay: '1.3s' },
        { x: 84, y: 288, r: 1.4, delay: '2s' },
        { x: 200, y: 60, r: 1.6, delay: '2.6s' },
      ].map((star, index) => (
        <circle key={index} cx={star.x} cy={star.y} r={star.r} fill="#f2eee5" opacity="0.6" className="animate-pulse" style={{ animationDelay: star.delay, animationDuration: '4s' }} />
      ))}

      {/* Fixed center star with a slow breathing glow — the one element meant to feel "alive". */}
      <circle cx={CENTER} cy={CENTER} r="30" fill="url(#orbitCenterGlow)" className="animate-[mv-breathe_5s_ease-in-out_infinite]" />
      <path d={`M${CENTER} 178l6 18 18 6-18 6-6 18-6-18-18-6 18-6z`} fill="#f2eee5" />
      <circle cx={CENTER} cy={CENTER} r="44" fill="none" stroke="#e6c980" strokeOpacity="0.4" strokeWidth="1" />
    </svg>
  );
}
