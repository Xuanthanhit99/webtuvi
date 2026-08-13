const STARS = [
  { x: 6, y: 12, r: 1.2, delay: '0s' },
  { x: 18, y: 28, r: 0.8, delay: '1.2s' },
  { x: 32, y: 8, r: 1, delay: '2.1s' },
  { x: 47, y: 22, r: 1.4, delay: '0.6s' },
  { x: 61, y: 6, r: 0.9, delay: '1.8s' },
  { x: 74, y: 18, r: 1.1, delay: '0.9s' },
  { x: 88, y: 10, r: 0.8, delay: '2.4s' },
  { x: 12, y: 42, r: 0.9, delay: '1.5s' },
  { x: 40, y: 48, r: 1.2, delay: '0.3s' },
  { x: 68, y: 40, r: 0.8, delay: '2.7s' },
  { x: 92, y: 34, r: 1, delay: '1.1s' },
  { x: 24, y: 62, r: 0.9, delay: '2s' },
  { x: 55, y: 70, r: 1.1, delay: '0.4s' },
  { x: 82, y: 60, r: 0.8, delay: '1.6s' },
  { x: 8, y: 80, r: 1, delay: '2.9s' },
];

/**
 * Deep-space backdrop for the /menh-vi route tree: flat navy base, two faint radial glows,
 * and a sparse static starfield. No raster asset needed (see reference breakdown §6) — the
 * brief explicitly warns against excessive particle effects, so this stays understated and static.
 */
export function MvBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-mv-bg" aria-hidden="true">
      <div
        className="absolute -left-1/4 -top-1/3 h-[60vh] w-[60vh] rounded-full opacity-40 blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(119,101,255,0.22) 0%, transparent 70%)' }}
      />
      <div
        className="absolute -right-1/4 top-1/4 h-[50vh] w-[50vh] rounded-full opacity-30 blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(217,188,120,0.14) 0%, transparent 70%)' }}
      />
      <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice">
        {STARS.map((star, i) => (
          <circle
            key={i}
            cx={`${star.x}%`}
            cy={`${star.y}%`}
            r={star.r}
            fill="#F4F1EA"
            className="animate-pulse"
            style={{ animationDuration: '4s', animationDelay: star.delay, opacity: 0.5 }}
          />
        ))}
      </svg>
    </div>
  );
}
