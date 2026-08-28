'use client';

/**
 * The "ritual table" the brief asks for — a restrained dark surface with a soft center vignette
 * and faint corner gold marks, wrapped around the shuffle/select/reveal phases only (landing,
 * intention and spread-type choice stay plain form-like steps; the table appears once the user has
 * actually committed to a draw). Scoped to this panel's own container, not the page chrome — the
 * brief's "do not hide navigation permanently" rule means this never dims anything outside itself.
 */
export function RitualStage({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-md bg-[radial-gradient(ellipse_120%_90%_at_50%_20%,rgba(213,173,98,0.05),transparent_65%),linear-gradient(180deg,#050a12_0%,#070f1a_100%)]">
      <span className="pointer-events-none absolute left-3 top-3 h-5 w-5 border-l border-t border-insight/25" aria-hidden="true" />
      <span className="pointer-events-none absolute right-3 top-3 h-5 w-5 border-r border-t border-insight/25" aria-hidden="true" />
      <span className="pointer-events-none absolute bottom-3 left-3 h-5 w-5 border-b border-l border-insight/25" aria-hidden="true" />
      <span className="pointer-events-none absolute bottom-3 right-3 h-5 w-5 border-b border-r border-insight/25" aria-hidden="true" />
      {children}
    </div>
  );
}
