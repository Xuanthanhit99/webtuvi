/**
 * The "Constellation Thread" motif (docs/reference Module 4 §9): a few soft
 * points connecting with a slow, single, non-looping draw-in — never a robot,
 * never game-like decoration. Respects prefers-reduced-motion via CSS only
 * (motion-reduce: variants), no JS media-query branching needed.
 */
export function Constellation({ density = 'medium' }: { density?: 'low' | 'medium' | 'high' }) {
  const points =
    density === 'high'
      ? [
          [40, 220],
          [180, 60],
          [340, 160],
          [480, 40],
          [560, 200],
        ]
      : density === 'medium'
        ? [
            [60, 180],
            [220, 60],
            [400, 150],
          ]
        : [
            [80, 120],
            [260, 70],
          ];

  const path = points.map((p) => p.join(',')).join(' ');

  return (
    <svg
      viewBox="0 0 600 260"
      fill="none"
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full opacity-70"
    >
      <polyline
        points={path}
        stroke="#E3B368"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.5"
        pathLength={1}
        strokeDasharray="1"
        strokeDashoffset="1"
        className="motion-safe:animate-[constellation-draw_1.4s_ease-out_forwards]"
      />
      {points.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="3" fill="#E3B368" />
      ))}
    </svg>
  );
}
